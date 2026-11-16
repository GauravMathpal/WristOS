package com.wristos.app.data.remote.ai

sealed class AssistantAction {
    data class CreateTask(val title: String, val dueTime: String = "Today") : AssistantAction()
    data class SaveMemory(val tag: String, val fact: String) : AssistantAction()
    data class WatchAlert(val message: String) : AssistantAction()
    data object None : AssistantAction()
}
