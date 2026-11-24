package com.wristos.app.ui.tasks

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.task.TaskEntity
import com.wristos.app.data.remote.ai.GeminiAssistantClient
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class TasksViewModel(application: Application) : AndroidViewModel(application) {
    private val taskDao = WristOSDatabase.getDatabase(application).taskDao()
    private val bleManager = BleManagerProvider.getInstance(application)

    val tasks: StateFlow<List<TaskEntity>> = taskDao.getAllTasks()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun addNaturalLanguageTask(rawInput: String): String? {
        var text = rawInput.trim()
        if (text.isBlank()) return null

        var priority = "normal"
        var category = "general"

        if (Regex("(#urgent|!urgent|\\burgent\\b)", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            priority = "urgent"
            text = text.replace(Regex("(#urgent|!urgent)", RegexOption.IGNORE_CASE), "").trim()
        } else if (Regex("(#high|!high|\\bhigh\\b)", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            priority = "high"
            text = text.replace(Regex("(#high|!high)", RegexOption.IGNORE_CASE), "").trim()
        }

        when {
            Regex("#study|\\bstudy\\b", RegexOption.IGNORE_CASE).containsMatchIn(text) -> {
                category = "study"
                text = text.replace(Regex("#study", RegexOption.IGNORE_CASE), "").trim()
            }
            Regex("#work|\\bwork\\b", RegexOption.IGNORE_CASE).containsMatchIn(text) -> {
                category = "work"
                text = text.replace(Regex("#work", RegexOption.IGNORE_CASE), "").trim()
            }
            Regex("#health|\\bhealth\\b", RegexOption.IGNORE_CASE).containsMatchIn(text) -> {
                category = "health"
                text = text.replace(Regex("#health", RegexOption.IGNORE_CASE), "").trim()
            }
        }

        val (parsedTitle, parsedDue) = GeminiAssistantClient.extractTaskDetails(text)
        val finalTitle = parsedTitle.ifBlank { rawInput.trim() }
        addTask(finalTitle, parsedDue, priority, category)
        return "\"$finalTitle\" ($parsedDue)"
    }

    fun addTask(
        title: String,
        dueTime: String = "Today",
        priority: String = "normal",
        category: String = "general"
    ) {
        viewModelScope.launch {
            taskDao.insertTask(
                TaskEntity(
                    title = title.trim(),
                    dueTime = dueTime.trim().ifEmpty { "Today" },
                    priority = priority,
                    category = category
                )
            )
        }
    }

    fun toggleTask(task: TaskEntity) {
        viewModelScope.launch {
            taskDao.updateTask(task.copy(isCompleted = !task.isCompleted))
        }
    }

    fun deleteTask(task: TaskEntity) {
        viewModelScope.launch {
            taskDao.deleteTask(task)
        }
    }

    fun sendTaskAlertToWatch(task: TaskEntity) {
        bleManager.sendAlertNotification("Task: ${task.title}", "Due ${task.dueTime}")
    }
}
