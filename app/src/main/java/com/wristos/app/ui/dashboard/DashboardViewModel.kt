package com.wristos.app.ui.dashboard

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.ble.WatchData
import com.wristos.app.data.local.SettingsPreferences
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.data.local.task.TaskEntity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class DashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val bleManager = BleManagerProvider.getInstance(application)
    private val database = WristOSDatabase.getDatabase(application)
    val prefs = SettingsPreferences.getInstance(application)

    val watchData: StateFlow<WatchData> = bleManager.watchData

    val tasks: StateFlow<List<TaskEntity>> = database.taskDao().getAllTasks()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val pendingTasksCount: StateFlow<Int> = tasks
        .map { list -> list.count { !it.isCompleted } }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    val memoriesCount: StateFlow<Int> = database.memoryDao().getAllMemories()
        .map { it.size }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    fun connectWatch() {
        bleManager.startScan()
    }

    fun disconnectWatch() {
        bleManager.disconnect()
    }

    fun syncTelemetry() {
        bleManager.forceSyncTelemetry()
    }

    fun sendTestAlert(message: String = "WristOS Alert: Focus session starting!") {
        bleManager.sendAlertNotification(message)
    }

    fun addQuickTask(title: String, dueTime: String, priority: String = "normal") {
        if (title.isBlank()) return
        viewModelScope.launch {
            database.taskDao().insertTask(
                TaskEntity(title = title.trim(), dueTime = dueTime.trim().ifEmpty { "Today" }, priority = priority)
            )
        }
    }

    fun addQuickReminder(title: String, time: String) {
        if (title.isBlank()) return
        viewModelScope.launch {
            database.taskDao().insertTask(
                TaskEntity(
                    title = "Reminder: ${title.trim()}",
                    dueTime = time.trim().ifEmpty { "In 30 mins" },
                    priority = "high",
                    category = "reminder"
                )
            )
            bleManager.sendAlertNotification("Reminder: ${title.trim()}")
        }
    }

    fun addQuickMemory(tag: String, fact: String) {
        if (fact.isBlank()) return
        viewModelScope.launch {
            database.memoryDao().insertMemory(
                MemoryEntity(tag = tag.trim().ifEmpty { "Personal" }, fact = fact.trim())
            )
        }
    }

    fun toggleTask(task: TaskEntity) {
        viewModelScope.launch {
            database.taskDao().updateTask(task.copy(isCompleted = !task.isCompleted))
        }
    }
}
