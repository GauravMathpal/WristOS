package com.wristos.app.ui.assistant

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.core.voice.VoiceManager
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.local.SettingsPreferences
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.data.local.task.TaskEntity
import com.wristos.app.data.remote.ai.AssistantAction
import com.wristos.app.data.remote.ai.GeminiAssistantClient
import kotlinx.coroutines.delay
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
    private val prefs = SettingsPreferences.getInstance(application)
    private val geminiClient = GeminiAssistantClient { prefs.customGeminiApiKey.value }
    val voiceManager = VoiceManager(application)
    val bleManager = BleManagerProvider.getInstance(application)

    private val _messages = MutableStateFlow<List<AssistantMessage>>(
        listOf(
            AssistantMessage(
                content = "WristOS Intelligence is online. Tap the orb or triple-click your watch button to speak commands, create tasks, or save memories.",
                isUser = false
            )
        )
    )
    val messages: StateFlow<List<AssistantMessage>> = _messages.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _remoteTriggerNotice = MutableStateFlow<String?>(null)
    val remoteTriggerNotice: StateFlow<String?> = _remoteTriggerNotice.asStateFlow()

    private val _lastSubmittedPrompt = MutableStateFlow("")
    val lastSubmittedPrompt: StateFlow<String> = _lastSubmittedPrompt.asStateFlow()

    private val _lastAssistantReply = MutableStateFlow<String?>(null)
    val lastAssistantReply: StateFlow<String?> = _lastAssistantReply.asStateFlow()

    val isGeminiConfigured: Boolean
        get() = geminiClient.isConfigured

    fun handleWatchTriggerIfPending() {
        if (bleManager.consumePendingAiTrigger()) {
            bleManager.dismissWakeNotification()
            voiceManager.playWakeChime()
            _remoteTriggerNotice.value = "Watch triggered AI (0xAA) • Listening..."
            viewModelScope.launch {
                // Small delay allows screen/audio focus to settle when waking from locked state
                delay(220L)
                if (prefs.autoListenOnTrigger.value && !voiceManager.isListening.value) {
                    startVoiceInput()
                }
                delay(3800L)
                _remoteTriggerNotice.value = null
            }
        }
    }

    fun triggerWatchWakeTest() {
        bleManager.triggerAiManually()
        handleWatchTriggerIfPending()
    }

    fun clearChat() {
        voiceManager.stopSpeaking()
        if (voiceManager.isListening.value) {
            voiceManager.stopListening(markDelivered = true)
        }
        _lastSubmittedPrompt.value = ""
        _lastAssistantReply.value = null
        _messages.value = listOf(
            AssistantMessage(
                content = "Chat cleared. What goals, tasks, or watch metrics can I help you with?",
                isUser = false
            )
        )
    }

    fun sendMessage(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _isLoading.value) return

        val userMsg = AssistantMessage(content = trimmed, isUser = true)
        val historySnapshot = _messages.value.takeLast(6).map { msg ->
            (if (msg.isUser) "User" else "Assistant") to msg.content
        }
        _messages.value = _messages.value + userMsg
        _lastSubmittedPrompt.value = trimmed
        _isLoading.value = true

        viewModelScope.launch {
            val memories = database.memoryDao().getAllMemories().first().map { "${it.tag}: ${it.fact}" }
            val tasks = database.taskDao().getAllTasks().first().filter { !it.isCompleted }.map { it.title }

            val reply = if (geminiClient.isConfigured) {
                val result = geminiClient.generateResponse(
                    userPrompt = trimmed,
                    personalMemories = memories,
                    pendingTasks = tasks,
                    recentHistory = historySnapshot
                )
                result.getOrElse {
                    geminiClient.generateOfflineResponse(trimmed, memories, tasks)
                }
            } else {
                geminiClient.generateOfflineResponse(trimmed, memories, tasks)
            }

            var actionNotice: String? = null
            when (val action = reply.action) {
                is AssistantAction.CreateTask -> {
                    database.taskDao().insertTask(
                        TaskEntity(title = action.title, dueTime = action.dueTime)
                    )
                    actionNotice = "Task created: \"${action.title}\" (${action.dueTime})"
                }
                is AssistantAction.SaveMemory -> {
                    database.memoryDao().insertMemory(
                        MemoryEntity(tag = action.tag, fact = action.fact)
                    )
                    actionNotice = "Memory saved to #${action.tag}"
                }
                is AssistantAction.WatchAlert -> {
                    bleManager.sendAlertNotification(action.message)
                    actionNotice = "Sent alert to watch: \"${action.message}\""
                }
                AssistantAction.None -> {}
            }

            _lastAssistantReply.value = reply.replyText
            _messages.value = _messages.value + AssistantMessage(
                content = reply.replyText,
                isUser = false,
                actionNotification = actionNotice
            )
            voiceManager.speak(reply.replyText)
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
