package com.wristos.app.data.remote.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.wristos.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

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
    ): Result<String> = withContext(Dispatchers.IO) {
        val activeModel = model
            ?: return@withContext Result.failure(
                IllegalStateException("Gemini API key is not configured. Please add GEMINI_API_KEY in local.properties.")
            )

        val contextBuilder = StringBuilder()
        contextBuilder.append("You are WristOS, an intelligent and concise personal assistant ecosystem on phone and watch.\n")
        contextBuilder.append("Keep your replies short, friendly, and practical (1-3 sentences max unless asked for detail).\n")

        if (personalMemories.isNotEmpty()) {
            contextBuilder.append("\nUser Facts & Context:\n")
            personalMemories.forEach { fact ->
                contextBuilder.append("- ").append(fact).append("\n")
            }
        }

        if (pendingTasks.isNotEmpty()) {
            contextBuilder.append("\nPending Tasks:\n")
            pendingTasks.forEach { task ->
                contextBuilder.append("- ").append(task).append("\n")
            }
        }

        contextBuilder.append("\nUser message: ").append(userPrompt)

        try {
            val response = activeModel.generateContent(contextBuilder.toString())
            val replyText = response.text?.trim() ?: "I couldn't process that response."
            Result.success(replyText)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
