package com.wristos.app.data.remote.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.wristos.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class AssistantReply(
    val replyText: String,
    val action: AssistantAction = AssistantAction.None
)

class GeminiAssistantClient {

    private val model: GenerativeModel? by lazy {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isNotBlank()) {
            GenerativeModel(
                modelName = "gemini-1.5-flash",
                apiKey = apiKey
            )
        } else {
            null
        }
    }

    val isConfigured: Boolean
        get() = BuildConfig.GEMINI_API_KEY.isNotBlank()

    suspend fun generateResponse(
        userPrompt: String,
        personalMemories: List<String> = emptyList(),
        pendingTasks: List<String> = emptyList()
    ): Result<AssistantReply> = withContext(Dispatchers.IO) {
        val activeModel = model
            ?: return@withContext Result.failure(
                IllegalStateException("Gemini API key is not configured. Falling back to Smart Engine.")
            )

        val promptBuilder = StringBuilder()
        promptBuilder.append("You are WristOS, an intelligent personal assistant powering an Android smartphone and a PineTime smartwatch.\n")
        promptBuilder.append("Keep your replies concise, friendly, and practical (1-2 sentences max).\n")
        promptBuilder.append("STRICT ACTION DIRECTIVE:\n")
        promptBuilder.append("- If the user states ANY task, to-do, deadline, or commitment (e.g., 'have to...', 'need to...', 'complete...', 'due tmr', 'remind me'), confirm concisely and ALWAYS append: [ACTION:TASK|Task Title|Due Time] at the very end.\n")
        promptBuilder.append("- If the user wants to remember or store a fact, confirm concisely and ALWAYS append: [ACTION:MEMORY|Category|Fact to remember] at the very end.\n")
        promptBuilder.append("- If the user wants to alert or buzz the watch, ALWAYS append: [ACTION:ALERT|Max 18 chars] at the very end.\n")
        promptBuilder.append("If no action is needed, do not include any ACTION tag.\n\n")

        if (personalMemories.isNotEmpty()) {
            promptBuilder.append("Known User Facts:\n")
            personalMemories.forEach { fact ->
                promptBuilder.append("• ").append(fact).append("\n")
            }
            promptBuilder.append("\n")
        }

        if (pendingTasks.isNotEmpty()) {
            promptBuilder.append("User's Pending Tasks:\n")
            pendingTasks.forEach { task ->
                promptBuilder.append("• ").append(task).append("\n")
            }
            promptBuilder.append("\n")
        }

        promptBuilder.append("User message: ").append(userPrompt)

        try {
            val response = activeModel.generateContent(promptBuilder.toString())
            val rawText = response.text?.trim() ?: "I couldn't process that."
            val reply = parseAssistantReply(rawText, userPrompt)
            Result.success(reply)
        } catch (e: Exception) {
            Result.failure(e)
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
                    val title = payload.getOrNull(0)?.trim() ?: "New Task"
                    val due = payload.getOrNull(1)?.trim() ?: "Today"
                    AssistantAction.CreateTask(title, due)
                }
                "MEMORY" -> {
                    val tag = payload.getOrNull(0)?.trim() ?: "General"
                    val fact = payload.getOrNull(1)?.trim() ?: ""
                    if (fact.isNotBlank()) AssistantAction.SaveMemory(tag, fact) else AssistantAction.None
                }
                "ALERT" -> {
                    val msg = payload.getOrNull(0)?.trim() ?: "WristOS Alert"
                    AssistantAction.WatchAlert(msg)
                }
                else -> AssistantAction.None
            }

            return AssistantReply(replyText = cleanText, action = action)
        }

        // Safety fallback: If Gemini omitted the action tag, extract intent from prompt
        if (userPrompt.isNotBlank()) {
            if (hasTaskIntent(userPrompt)) {
                val (title, dueTime) = extractTaskDetails(userPrompt)
                val cleanText = if (rawText.isBlank() || rawText.contains("I don't have that", ignoreCase = true)) {
                    "I've added \"$title\" to your agenda for $dueTime."
                } else {
                    rawText.trim()
                }
                return AssistantReply(replyText = cleanText, action = AssistantAction.CreateTask(title, dueTime))
            }

            if (hasMemoryIntent(userPrompt)) {
                val (tag, fact) = extractMemoryDetails(userPrompt)
                val cleanText = if (rawText.isBlank() || rawText.contains("I don't have that", ignoreCase = true)) {
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

    /**
     * Offline Smart Engine: Runs on device with 0 latency and 0 API requirements
     */
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
                    "Here is your game plan: Start with \"${pendingTasks[0]}\", then proceed with ${pendingTasks.drop(1).joinToString(", ")}. Begin with a 25-minute Pomodoro focus block!"
                } else {
                    "Your agenda is currently clear. What goals would you like to schedule for today?"
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
                AssistantReply(replyText = "You're tracking steadily with your daily activity goal and your resting heart rate is in optimal cardio range.")
            }
            lower.contains("who are you") || lower.contains("what can you do") -> {
                AssistantReply(replyText = "I am WristOS, your personal intelligence assistant. I manage your daily tasks, maintain your knowledge vault, monitor watch biometrics, and guide your focus sessions.")
            }
            else -> {
                AssistantReply(replyText = "I'm with you. You have ${pendingTasks.size} pending task(s) and ${personalMemories.size} facts in your records. What would you like to plan or remember next?")
            }
        }
    }

    fun hasTaskIntent(prompt: String): Boolean {
        val lower = prompt.lowercase()
        return Regex("\\b(have to|need to|must|have complete|complete|finish|submit|prepare|buy|call|schedule|remind|agenda|task|todo|to-do|due|deadline)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower) ||
               Regex("\\b(tmr|tomorrow|tonight)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower) ||
               Regex("\\b(by|at)\\s+\\d{1,2}(:\\d{2})?\\s*(am|pm)?\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
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

        var dueTime = "Today"
        val isTmr = Regex("\\b(tmr|tomorrow)\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
        val isTonight = Regex("\\btonight\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)
        val isToday = Regex("\\btoday\\b", RegexOption.IGNORE_CASE).containsMatchIn(lower)

        val clockMatch = Regex("\\b(?:at|by\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)\\b", RegexOption.IGNORE_CASE).find(text)
        var timeStr = ""
        if (clockMatch != null) {
            val hour = clockMatch.groupValues[1]
            val min = clockMatch.groupValues[2].ifEmpty { "00" }
            val ampm = clockMatch.groupValues[3].uppercase()
            timeStr = "$hour:$min $ampm"
        }

        dueTime = when {
            isTmr -> if (timeStr.isNotEmpty()) "Tomorrow, $timeStr" else "Tomorrow"
            isTonight -> if (timeStr.isNotEmpty()) "Tonight, $timeStr" else "Tonight, 9:00 PM"
            isToday -> if (timeStr.isNotEmpty()) "Today, $timeStr" else "Today"
            timeStr.isNotEmpty() -> "Today, $timeStr"
            else -> "Today"
        }

        var title = text
            .replace(Regex("^(please\\s+)?(remind me to|create a task to|add a task to|add task to|add a task|add task|create task|schedule a task to|schedule to|schedule a task|schedule|i have to|i have|i need to|i must|i should|have to|need to|set a reminder to|set reminder to)\\s*", RegexOption.IGNORE_CASE), "")
            .replace(Regex("\\b(?:by|at|due|on)?\\s*(?:tmr|tomorrow|tonight|today)(?:\\s*(?:at|by)?\\s*\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)?\\b", RegexOption.IGNORE_CASE), "")
            .replace(Regex("\\b(?:at|by)\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?\\b", RegexOption.IGNORE_CASE), "")
            .replace(Regex("\\b\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)\\b", RegexOption.IGNORE_CASE), "")
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
            lower.contains("health") || lower.contains("water") || lower.contains("bpm") || lower.contains("sleep") || lower.contains("blood") -> "Health"
            lower.contains("watch") || lower.contains("pinetime") || lower.contains("ble") || lower.contains("hardware") -> "Hardware"
            lower.contains("study") || lower.contains("exam") || lower.contains("code") || lower.contains("assignment") || lower.contains("work") -> "Work"
            else -> "Personal"
        }

        return Pair(tag, fact)
    }
}
