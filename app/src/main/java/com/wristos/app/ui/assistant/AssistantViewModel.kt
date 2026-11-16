package com.wristos.app.ui.assistant

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.core.voice.VoiceManager
import com.wristos.app.data.ble.WatchBleManager
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.data.local.task.TaskEntity
import com.wristos.app.data.remote.ai.AssistantAction
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
    val actionNotification: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

class AssistantViewModel(application: Application) : AndroidViewModel(application) {
    private val database = WristOSDatabase.getDatabase(application)
    private val geminiClient = GeminiAssistantClient()
    val voiceManager = VoiceManager(application)
    val bleManager = WatchBleManager(application)

    private val _messages = MutableStateFlow<List<AssistantMessage>>(
        listOf(
            AssistantMessage(
                content = "Greetings Gaurav! WristOS Intelligence is online. Speak or type to manage your day, memories, and watch.",
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
                val fallback = "Gemini API key is not configured. Add GEMINI_API_KEY in local.properties."
                _messages.value = _messages.value + AssistantMessage(content = fallback, isUser = false)
                voiceManager.speak(fallback)
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
                var actionNotice: String? = null

                // Process smart actions
                when (val action = reply.action) {
                    is AssistantAction.CreateTask -> {
                        database.taskDao().insertTask(
                            TaskEntity(title = action.title, dueTime = action.dueTime)
                        )
                        actionNotice = "Task created: \"${action.title}\""
                    }
                    is AssistantAction.SaveMemory -> {
                        database.memoryDao().insertMemory(
                            MemoryEntity(tag = action.tag, fact = action.fact)
                        )
                        actionNotice = "Memory saved to ${action.tag}: \"${action.fact}\""
                    }
                    is AssistantAction.WatchAlert -> {
                        bleManager.sendAlertNotification(action.message)
                        actionNotice = "Sent alert to watch: \"${action.message}\""
                    }
                    AssistantAction.None -> {}
                }

                _messages.value = _messages.value + AssistantMessage(
                    content = reply.replyText,
                    isUser = false,
                    actionNotification = actionNotice
                )
                voiceManager.speak(reply.replyText)
            }.onFailure { err ->
                val errorMsg = "AI Error: ${err.localizedMessage ?: "Could not connect to Gemini."}"
                _messages.value = _messages.value + AssistantMessage(content = errorMsg, isUser = false)
                voiceManager.speak(errorMsg)
            }

            _isLoading.value = false
        }
    }

    fun startVoiceInput() {
        voiceManager.startListening { spokenText ->
            sendMessage(spokenText)
        }
    }

    override fun onCleared() {
        super.onCleared()
        voiceManager.destroy()
    }
}
