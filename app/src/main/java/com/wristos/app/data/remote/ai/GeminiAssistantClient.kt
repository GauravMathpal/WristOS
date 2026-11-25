package com.wristos.app.data.remote.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.wristos.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class AssistantReply(
    val replyText: String,
    val action: AssistantAction = AssistantAction.None
)

data class CloudDailyBriefing(
    val greeting: String,
    val priorities: List<String>,
    val healthInsight: String
)

class GeminiAssistantClient(
    private val customApiKeyProvider: () -> String = { "" }
) {

    private var cachedApiKey: String? = null
    private var primaryModel: GenerativeModel? = null
    private var fallbackModel: GenerativeModel? = null

    private fun activeApiKey(): String {
        val custom = customApiKeyProvider().trim()
        return custom.ifBlank { BuildConfig.GEMINI_API_KEY.trim() }
    }

    private val hasSupabaseEdge: Boolean
        get() = BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()

    val isConfigured: Boolean
        get() = activeApiKey().isNotBlank() || hasSupabaseEdge

    private fun ensureModels(): Pair<GenerativeModel, GenerativeModel>? {
        val key = activeApiKey()
        if (key.isBlank()) return null
        if (cachedApiKey != key || primaryModel == null || fallbackModel == null) {
            cachedApiKey = key
            primaryModel = GenerativeModel(modelName = "gemini-2.0-flash", apiKey = key)
            fallbackModel = GenerativeModel(modelName = "gemini-1.5-flash", apiKey = key)
        }
        return Pair(primaryModel!!, fallbackModel!!)
    }

    suspend fun generateResponse(
        userPrompt: String,
        personalMemories: List<String> = emptyList(),
        pendingTasks: List<String> = emptyList(),
        recentHistory: List<Pair<String, String>> = emptyList()
    ): Result<AssistantReply> = withContext(Dispatchers.IO) {
        val models = ensureModels()
        if (models != null) {
            val promptBuilder = StringBuilder()
            promptBuilder.append("You are WristOS, an intelligent personal assistant powering an Android smartphone and a PineTime smartwatch.\n")
            promptBuilder.append("Keep your replies concise, friendly, and practical (1-2 sentences max).\n")
            promptBuilder.append("STRICT ACTION DIRECTIVE:\n")
            promptBuilder.append("- If the user states ANY task, to-do, deadline, or commitment (e.g., 'have to...', 'need to...', 'complete...', 'by tmr 5pm', 'remind me'), confirm concisely and ALWAYS append: [ACTION:TASK|Task Title|Due Time] at the very end.\n")
            promptBuilder.append("- If the user wants to remember or store a fact, confirm concisely and ALWAYS append: [ACTION:MEMORY|Category|Fact to remember] at the very end.\n")
            promptBuilder.append("- If the user wants to alert or buzz the watch, ALWAYS append: [ACTION:ALERT|Max 18 chars] at the very end.\n")
            promptBuilder.append("If no action is needed, do not include any ACTION tag.\n\n")

            if (personalMemories.isNotEmpty()) {
                promptBuilder.append("Known User Facts:\n")
                personalMemories.take(6).forEach { fact ->
                    promptBuilder.append("• ").append(fact).append("\n")
                }
                promptBuilder.append("\n")
            }

            if (pendingTasks.isNotEmpty()) {
                promptBuilder.append("User's Pending Tasks:\n")
                pendingTasks.take(6).forEach { task ->
                    promptBuilder.append("• ").append(task).append("\n")
                }
                promptBuilder.append("\n")
            }

            if (recentHistory.isNotEmpty()) {
                promptBuilder.append("Recent Conversation:\n")
                recentHistory.takeLast(6).forEach { (role, msg) ->
                    promptBuilder.append(role).append(": ").append(msg).append("\n")
                }
                promptBuilder.append("\n")
            }

            promptBuilder.append("User message: ").append(userPrompt)
            val fullPrompt = promptBuilder.toString()

            try {
                val response = try {
                    models.first.generateContent(fullPrompt)
                } catch (_: Exception) {
                    models.second.generateContent(fullPrompt)
                }
                val rawText = response.text?.trim()
                if (!rawText.isNullOrBlank()) {
                    return@withContext Result.success(parseAssistantReply(rawText, userPrompt))
                }
            } catch (_: Exception) {
                // Fall through to Supabase Edge Function
            }
        }

        if (hasSupabaseEdge) {
            val cloud = callSupabaseChat(userPrompt, personalMemories, pendingTasks)
            if (cloud != null) {
                return@withContext Result.success(cloud)
            }
        }

        Result.failure(IllegalStateException("Cloud AI unreachable. Using offline Smart Engine."))
    }

    suspend fun generateDailyBriefing(
        pendingTasks: List<Pair<String, String>>,
        memories: List<Pair<String, String>>,
        steps: Int,
        stepGoal: Int,
        heartRateAvg: Int,
        focusMinutes: Int
    ): CloudDailyBriefing? = withContext(Dispatchers.IO) {
        if (!hasSupabaseEdge) return@withContext null
        try {
            val payload = JSONObject().apply {
                put("tasks", JSONArray().apply {
                    pendingTasks.take(5).forEach { (title, due) ->
                        put(JSONObject().put("title", title).put("dueTime", due).put("isCompleted", false))
                    }
                })
                put("memories", JSONArray().apply {
                    memories.take(4).forEach { (tag, fact) ->
                        put(JSONObject().put("tag", tag).put("fact", fact))
                    }
                })
                put("activity", JSONObject().apply {
                    put("steps", steps)
                    put("stepGoal", stepGoal)
                    put("heartRateAvg", heartRateAvg)
                })
                put("focusMinutes", focusMinutes)
            }
            val respText = postSupabaseEdge("gemini-briefing", payload.toString()) ?: return@withContext null
            val json = JSONObject(respText)
            val greeting = json.optString("greeting").trim()
            val health = json.optString("healthInsight").trim()
            val arr = json.optJSONArray("priorities")
            val priorities = buildList {
                if (arr != null) {
                    for (i in 0 until arr.length()) {
                        val item = arr.optString(i).trim()
                        if (item.isNotBlank()) add(item)
                    }
                }
            }
            if (greeting.isNotBlank()) CloudDailyBriefing(greeting, priorities, health) else null
        } catch (_: Exception) {
            null
        }
    }

    private fun enrichPromptForSupabase(prompt: String): String {
        val clean = prompt.trim()
        return when {
            hasTaskIntent(clean) ->
                "[Action Request: The user is stating a task, commitment, or deadline. Extract the task title and due time, confirm concisely in 1 sentence, and append [ACTION:TASK|Task Title|Due Time] at the end]\nUser says: $clean"
            hasMemoryIntent(clean) ->
                "[Action Request: The user is stating a personal fact to remember. Extract category and fact, confirm concisely, and append [ACTION:MEMORY|Category|Fact] at the end]\nUser says: $clean"
            hasAlertIntent(clean) ->
                "[Action Request: The user wants to trigger a watch alert. Confirm and append [ACTION:ALERT|Max 18 chars] at the end]\nUser says: $clean"
            else -> clean
        }
    }

    private fun callSupabaseChat(
        userPrompt: String,
        memories: List<String>,
        tasks: List<String>
    ): AssistantReply? {
        return try {
            val payload = JSONObject().apply {
                put("prompt", enrichPromptForSupabase(userPrompt))
                put("memories", JSONArray(memories.take(6)))
                put("tasks", JSONArray(tasks.take(6)))
            }
            val respText = postSupabaseEdge("gemini-chat", payload.toString()) ?: return null
            val reply = JSONObject(respText).optString("reply").trim()
            if (reply.isNotBlank()) parseAssistantReply(reply, userPrompt) else null
        } catch (_: Exception) {
            null
        }
    }

    private fun postSupabaseEdge(functionName: String, jsonBody: String): String? {
        val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
        val url = URL("$baseUrl/functions/v1/$functionName")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 8000
            readTimeout = 15000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("apikey", BuildConfig.SUPABASE_ANON_KEY)
            setRequestProperty("Authorization", "Bearer ${BuildConfig.SUPABASE_ANON_KEY}")
        }
        return try {
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(jsonBody)
                writer.flush()
            }
            if (conn.responseCode in 200..299) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else {
                null
            }
        } finally {
            conn.disconnect()
        }
    }

    fun parseAssistantReply(rawText: String, userPrompt: String = ""): AssistantReply {
        val actionRegex = Regex("\\[ACTION:(TASK|MEMORY|ALERT)\\|(.*?)\\]", RegexOption.DOT_MATCHES_ALL)
        val match = actionRegex.find(rawText)

        if (match != null) {
            val cleanText = rawText.replace(match.value, "").trim()
            val type = match.groupValues[1]
            val payload = match.groupValues[2].split("|")

            val action = when (type) {
                "TASK" -> {
                    val title = payload.getOrNull(0)?.trim()?.ifBlank { "New Task" } ?: "New Task"
                    val due = payload.getOrNull(1)?.trim()?.ifBlank { "Today" } ?: "Today"
                    AssistantAction.CreateTask(title, due)
                }
                "MEMORY" -> {
                    val tag = payload.getOrNull(0)?.trim()?.ifBlank { "Personal" } ?: "Personal"
                    val fact = payload.getOrNull(1)?.trim().orEmpty()
                    if (fact.isNotBlank()) AssistantAction.SaveMemory(tag, fact) else AssistantAction.None
                }
                "ALERT" -> {
                    val msg = payload.getOrNull(0)?.trim()?.ifBlank { "WristOS Alert" } ?: "WristOS Alert"
                    AssistantAction.WatchAlert(msg)
                }
                else -> AssistantAction.None
            }

            return AssistantReply(replyText = cleanText, action = action)
        }

        // Safety fallback: If LLM omitted the action tag, detect intent directly from prompt
        if (userPrompt.isNotBlank()) {
            if (hasTaskIntent(userPrompt)) {
                val (title, dueTime) = extractTaskDetails(userPrompt)
                val cleanText = if (rawText.isBlank() ||
                    rawText.contains("I don't have that", ignoreCase = true) ||
                    rawText.contains("I'm with you", ignoreCase = true)
                ) {
                    "I've added \"$title\" to your agenda for $dueTime."
                } else {
                    rawText.trim()
                }
                return AssistantReply(replyText = cleanText, action = AssistantAction.CreateTask(title, dueTime))
            }

            if (hasMemoryIntent(userPrompt)) {
                val (tag, fact) = extractMemoryDetails(userPrompt)
                val cleanText = if (rawText.isBlank() ||
                    rawText.contains("I don't have that", ignoreCase = true) ||
                    rawText.contains("I'm with you", ignoreCase = true)
                ) {
                    "Saved \"$fact\" to your Knowledge Vault under #$tag."
                } else {
                    rawText.trim()
                }
                return AssistantReply(replyText = cleanText, action = AssistantAction.SaveMemory(tag, fact))
            }

            if (hasAlertIntent(userPrompt)) {
                return AssistantReply(
                    replyText = "Dispatched a haptic alert notification to your smartwatch.",
                    action = AssistantAction.WatchAlert("WristOS Priority")
                )
            }
        }

        return AssistantReply(replyText = rawText.trim(), action = AssistantAction.None)
    }

    fun generateOfflineResponse(
        userPrompt: String,
        personalMemories: List<String> = emptyList(),
        pendingTasks: List<String> = emptyList()
    ): AssistantReply {
        val clean = userPrompt.trim()
        val lower = clean.lowercase()

        return when {
            lower.contains("plan my day") || lower.contains("daily schedule") || lower.contains("what should i do") -> {
                val reply = if (pendingTasks.isNotEmpty()) {
                    val rest = pendingTasks.drop(1)
                    if (rest.isNotEmpty()) {
                        "Here is your game plan: Start with \"${pendingTasks[0]}\", then proceed with ${rest.joinToString(", ")}. Begin with a 25-minute focus block!"
                    } else {
                        "Here is your game plan: Focus on \"${pendingTasks[0]}\" first with a 25-minute Pomodoro block!"
                    }
                } else {
                    "Your agenda is currently clear. Tell me what tasks or goals you want to schedule today."
                }
                AssistantReply(replyText = reply)
            }
            hasTaskIntent(clean) -> {
                val (title, dueTime) = extractTaskDetails(clean)
                AssistantReply(
                    replyText = "I've added \"$title\" to your agenda for $dueTime.",
                    action = AssistantAction.CreateTask(title, dueTime)
                )
            }
            hasMemoryIntent(clean) -> {
                val (tag, fact) = extractMemoryDetails(clean)
                AssistantReply(
                    replyText = "Saved \"$fact\" to your Knowledge Vault under #$tag.",
                    action = AssistantAction.SaveMemory(tag, fact)
                )
            }
            hasAlertIntent(clean) -> {
                AssistantReply(
                    replyText = "Dispatched a haptic alert notification to your smartwatch.",
                    action = AssistantAction.WatchAlert("WristOS Priority")
                )
            }
            lower.contains("health") || lower.contains("step") || lower.contains("heart rate") || lower.contains("bpm") -> {
                AssistantReply(replyText = "You're tracking steadily toward your daily activity goal and your watch telemetry bridge is active.")
            }
            lower.contains("who are you") || lower.contains("what can you do") -> {
                AssistantReply(replyText = "I am WristOS, your personal intelligence assistant. I manage your daily tasks, save facts to your Knowledge Vault, and send alerts to your watch.")
            }
            else -> {
                AssistantReply(replyText = "I'm ready. You have ${pendingTasks.size} pending task(s) and ${personalMemories.size} saved memories. What should we plan or save next?")
            }
        }
    }

    companion object {
        fun hasTaskIntent(prompt: String): Boolean {
            val lower = prompt.lowercase()
            return Regex("\\b(have to|need to|must|have complete|complete|finish|submit|prepare|buy|call|schedule|remind|agenda|task|todo|to-do|due|deadline)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower) ||
                Regex("\\b(tmr|tomorrow|tonight)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower) ||
                Regex("\\b(by|at)\\s+\\d{1,2}(:\\d{2})?\\s*(am|pm)?\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower) ||
                Regex("\\b\\d{1,2}(:\\d{2})?\\s*(am|pm)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
        }

        fun hasMemoryIntent(prompt: String): Boolean {
            val lower = prompt.lowercase()
            return Regex("\\b(remember that|remember|save fact that|save fact|note that|store fact|keep in mind|my \\w+ is)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
        }

        fun hasAlertIntent(prompt: String): Boolean {
            val lower = prompt.lowercase()
            return Regex("\\b(vibrate|buzz|alert watch|ping watch|haptic|alarm)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
        }

        fun extractTaskDetails(rawPrompt: String): Pair<String, String> {
            val text = rawPrompt.trim()
            val lower = text.lowercase()

            val isTmr = Regex("\\b(tmr|tomorrow)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
            val isTonight = Regex("\\btonight\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
            val isToday = Regex("\\btoday\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)

            val standardMatch = Regex("\\b(?:at|by\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)\\b", RegexOption.IGNORE_CASE).find(text)
            val militaryMatch = Regex("\\b(?:at|by\\s+)?([01]?\\d|2[0-3]):([0-5]\\d)\\b", RegexOption.IGNORE_CASE).find(text)
            val bareMatch = Regex("\\b(?:at|by)\\s+(\\d{1,2})\\b", RegexOption.IGNORE_CASE).find(text)

            var timeStr = ""
            if (standardMatch != null) {
                val hour = standardMatch.groupValues[1].toIntOrNull() ?: 12
                val min = standardMatch.groupValues[2].ifEmpty { "00" }
                val ampm = standardMatch.groupValues[3].uppercase()
                timeStr = "$hour:$min $ampm"
            } else if (militaryMatch != null) {
                var hour = militaryMatch.groupValues[1].toIntOrNull() ?: 12
                val min = militaryMatch.groupValues[2]
                val ampm = if (hour >= 12) "PM" else "AM"
                hour = if (hour % 12 == 0) 12 else hour % 12
                timeStr = "$hour:$min $ampm"
            } else if (bareMatch != null) {
                val hour = bareMatch.groupValues[1].toIntOrNull() ?: 0
                if (hour in 1..12) {
                    val ampm = if (hour in 1..7) "PM" else "AM"
                    timeStr = "$hour:00 $ampm"
                }
            }

            val dueTime = when {
                isTmr -> if (timeStr.isNotEmpty()) "Tomorrow, $timeStr" else "Tomorrow"
                isTonight -> if (timeStr.isNotEmpty()) "Tonight, $timeStr" else "Tonight, 9:00 PM"
                isToday -> if (timeStr.isNotEmpty()) "Today, $timeStr" else "Today"
                timeStr.isNotEmpty() -> "Today, $timeStr"
                else -> "Today"
            }

            var title = text
                .replace(
                    Regex(
                        "^(please\\s+)?(remind me to|create a task to|add a task to|add task to|add a task|add task|create task|schedule a task to|schedule to|schedule a task|schedule|i have to complete|i have complete|i have to finish|i have finish|i have to|i have|i need to|i must|i should|have to complete|have complete|have to|need to|set a reminder to|set reminder to)\\s*",
                        RegexOption.IGNORE_CASE
                    ),
                    ""
                )
                .replace(Regex("\\b(?:by|at|due|on)?\\s*(?:tmr|tomorrow|tonight|today)(?:\\s*(?:at|by)?\\s*\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)?\\b", RegexOption.IGNORE_CASE), "")
                .replace(Regex("\\b(?:at|by)\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?\\b", RegexOption.IGNORE_CASE), "")
                .replace(Regex("\\b\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)\\b", RegexOption.IGNORE_CASE), "")
                .replace(Regex("\\s{2,}"), " ")
                .trim(' ', ',', '.', ':', ';', '-')

            if (title.isBlank()) title = text
            title = title.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }

            return Pair(title, dueTime)
        }

        fun extractMemoryDetails(rawPrompt: String): Pair<String, String> {
            val text = rawPrompt.trim()
            val lower = text.lowercase()

            val fact = text
                .replace(Regex("^(please\\s+)?(remember that|remember|save fact that|save fact|note that|store fact|keep in mind)\\s*", RegexOption.IGNORE_CASE), "")
                .trim(' ', ',', '.', ':', ';', '-')
                .ifBlank { text }

            val tag = when {
                lower.contains("health") || lower.contains("water") || lower.contains("bpm") || lower.contains("sleep") || lower.contains("blood") || lower.contains("cardio") -> "Health"
                lower.contains("watch") || lower.contains("pinetime") || lower.contains("ble") || lower.contains("hardware") || lower.contains("battery") -> "Hardware"
                lower.contains("study") || lower.contains("exam") || lower.contains("code") || lower.contains("assignment") || lower.contains("work") || lower.contains("project") -> "Work"
                else -> "Personal"
            }

            return Pair(tag, fact)
        }
    }
}
