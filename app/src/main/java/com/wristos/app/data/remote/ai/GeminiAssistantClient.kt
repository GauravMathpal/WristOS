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
                IllegalStateException("Gemini API key is not configured. Please add GEMINI_API_KEY in local.properties.")
            )

        val promptBuilder = StringBuilder()
        promptBuilder.append("You are WristOS, an intelligent personal assistant powering an Android smartphone and a PineTime smartwatch.\n")
        promptBuilder.append("Keep your replies concise, friendly, and practical (1-3 sentences max).\n")
        promptBuilder.append("You can trigger smart actions by including a command tag at the very end of your response:\n")
        promptBuilder.append("- To create a task: [ACTION:TASK|Task Title|Due Time]\n")
        promptBuilder.append("- To save a memory/fact: [ACTION:MEMORY|Category|Fact to remember]\n")
        promptBuilder.append("- To alert the watch: [ACTION:ALERT|Alert text max 18 chars]\n")
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
            val reply = parseAssistantReply(rawText)
            Result.success(reply)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun parseAssistantReply(rawText: String): AssistantReply {
        val actionRegex = Regex("\\[ACTION:(TASK|MEMORY|ALERT)\\|(.*?)\\]", RegexOption.DOT_MATCHES_ALL)
        val match = actionRegex.find(rawText)

        if (match == null) {
            return AssistantReply(replyText = rawText, action = AssistantAction.None)
        }

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
}
