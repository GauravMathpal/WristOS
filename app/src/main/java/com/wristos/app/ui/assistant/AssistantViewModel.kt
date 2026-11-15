package com.wristos.app.ui.assistant

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.remote.ai.GeminiAssistantClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class AssistantMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val content: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

class AssistantViewModel(application: Application) : AndroidViewModel(application) {
    private val database = WristOSDatabase.getDatabase(application)
    private val geminiClient = GeminiAssistantClient()

    private val _messages = MutableStateFlow<List<AssistantMessage>>(
        listOf(
            AssistantMessage(
                content = "Hello! I'm WristOS. How can I assist you with your day, tasks, or watch?",
                isUser = false
            )
        )
    )
    val messages: StateFlow<List<AssistantMessage>> = _messages.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    val isGeminiConfigured: Boolean = geminiClient.isConfigured

    fun sendMessage(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _isLoading.value) return

        val userMsg = AssistantMessage(content = trimmed, isUser = true)
        _messages.value = _messages.value + userMsg
        _isLoading.value = true

        viewModelScope.launch {
            if (!geminiClient.isConfigured) {
                _messages.value = _messages.value + AssistantMessage(
                    content = "Gemini API key is not configured in local.properties. Add GEMINI_API_KEY=your_key to connect live AI.",
                    isUser = false
                )
                _isLoading.value = false
                return@launch
            }

            val memories = database.memoryDao().getAllMemories().first().map { "${it.tag}: ${it.fact}" }
            val tasks = database.taskDao().getAllTasks().first().filter { !it.isCompleted }.map { it.title }

            val result = geminiClient.generateResponse(
                userPrompt = trimmed,
                personalMemories = memories,
                pendingTasks = tasks
            )

            result.onSuccess { reply ->
                _messages.value = _messages.value + AssistantMessage(content = reply, isUser = false)
            }.onFailure { err ->
                _messages.value = _messages.value + AssistantMessage(
                    content = "AI error: ${err.localizedMessage ?: "Failed to reach Gemini."}",
                    isUser = false
                )
            }

            _isLoading.value = false
        }
    }
}
