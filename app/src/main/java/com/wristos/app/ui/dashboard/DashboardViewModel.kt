package com.wristos.app.ui.dashboard

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.data.ble.WatchData
import com.wristos.app.data.local.SettingsPreferences
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.data.local.task.TaskEntity
import com.wristos.app.data.local.wellness.DailyActivityEntity
import com.wristos.app.data.local.wellness.FocusSessionEntity
import com.wristos.app.data.local.wellness.HabitEntity
import com.wristos.app.data.local.wellness.HydrationEntity
import com.wristos.app.data.remote.ai.GeminiAssistantClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class DailyBriefingState(
    val greeting: String,
    val priorities: List<String>,
    val healthInsight: String
)

class DashboardViewModel(application: Application) : AndroidViewModel(application) {
    val bleManager = BleManagerProvider.getInstance(application)
    private val database = WristOSDatabase.getDatabase(application)
    val prefs = SettingsPreferences.getInstance(application)
    private val geminiClient = GeminiAssistantClient { prefs.customGeminiApiKey.value }

    private val todayKey: String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    val watchData: StateFlow<WatchData> = bleManager.watchData

    val tasks: StateFlow<List<TaskEntity>> = database.taskDao().getAllTasks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val pendingTasksCount: StateFlow<Int> = tasks
        .map { list -> list.count { !it.isCompleted } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val completedTasksCount: StateFlow<Int> = tasks
        .map { list -> list.count { it.isCompleted } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val memoriesCount: StateFlow<Int> = database.memoryDao().getAllMemories()
        .map { it.size }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val habits: StateFlow<List<HabitEntity>> = database.habitDao().getAllHabits()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val todayHydration: StateFlow<HydrationEntity?> = database.hydrationDao().observeForDate(todayKey)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val todayActivity: StateFlow<DailyActivityEntity?> = database.dailyActivityDao().observeForDate(todayKey)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val focusSessions: StateFlow<List<FocusSessionEntity>> = database.focusSessionDao().getAllSessions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _briefing = MutableStateFlow<DailyBriefingState?>(null)
    val briefing: StateFlow<DailyBriefingState?> = _briefing.asStateFlow()

    private val _isBriefingLoading = MutableStateFlow(false)
    val isBriefingLoading: StateFlow<Boolean> = _isBriefingLoading.asStateFlow()

    init {
        viewModelScope.launch {
            if (database.habitDao().getHabitCount() == 0) {
                database.habitDao().insertHabits(
                    listOf(
                        HabitEntity(title = "Drink 2.5L Water", category = "Health", streakCount = 0),
                        HabitEntity(title = "Morning Walk (20m)", category = "Health", streakCount = 0),
                        HabitEntity(title = "Read 20 mins", category = "Study", streakCount = 0),
                        HabitEntity(title = "Mindfulness & Breath", category = "Wellness", streakCount = 0)
                    )
                )
            }
        }

        // Persist real BLE telemetry updates (never synthetic data) for today's activity log
        viewModelScope.launch {
            watchData.collect { data ->
                if (data.connectionState == WatchConnectionState.CONNECTED && data.lastSyncTime > 0L) {
                    val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                    val existing = database.dailyActivityDao().getForDate(dateKey)
                    val newSteps = if (data.stepCount > 0) data.stepCount else (existing?.steps ?: 0)
                    val newHr = if (data.heartRate > 0) data.heartRate else (existing?.lastHeartRate ?: 0)
                    if (newSteps != (existing?.steps ?: -1) || newHr != (existing?.lastHeartRate ?: -1)) {
                        database.dailyActivityDao().upsert(
                            DailyActivityEntity(
                                date = dateKey,
                                steps = newSteps,
                                lastHeartRate = newHr,
                                lastSyncedAt = data.lastSyncTime
                            )
                        )
                    }
                }
            }
        }
    }

    fun connectWatch() = bleManager.startScan(forceActiveScan = true)
    fun disconnectWatch() = bleManager.disconnect()
    fun syncTelemetry() = bleManager.forceSyncTelemetry()
    fun sendTestAlert(message: String = "WristOS Alert: Focus session starting!") =
        bleManager.sendAlertNotification(message)

    fun addWater(amountMl: Int) {
        viewModelScope.launch {
            val current = database.hydrationDao().getForDate(todayKey)
                ?: HydrationEntity(date = todayKey, amountMl = 0, goalMl = 2500)
            database.hydrationDao().upsert(
                current.copy(
                    amountMl = (current.amountMl + amountMl).coerceAtLeast(0),
                    updatedAt = System.currentTimeMillis()
                )
            )
        }
    }

    fun toggleHabit(habit: HabitEntity) {
        viewModelScope.launch {
            val completedToday = habit.lastCompletedDate == todayKey
            database.habitDao().updateHabit(
                habit.copy(
                    lastCompletedDate = if (completedToday) "" else todayKey,
                    streakCount = if (completedToday) (habit.streakCount - 1).coerceAtLeast(0) else habit.streakCount + 1
                )
            )
        }
    }

    fun generateDailyBriefing() {
        if (_isBriefingLoading.value) return
        _isBriefingLoading.value = true
        viewModelScope.launch {
            val pending = tasks.value.filter { !it.isCompleted }
            val stepCount = watchData.value.stepCount
            val goal = prefs.dailyStepGoal.value
            val hr = watchData.value.heartRate
            val focusMins = focusSessions.value.sumOf { it.durationMinutes }

            val fallback = buildOfflineBriefing(pending, stepCount, goal, hr, focusMins)
            if (geminiClient.isConfigured) {
                val prompt = "Give me a 2-sentence daily briefing summarizing ${pending.size} pending tasks (${pending.take(3).joinToString { it.title }}), $stepCount/$goal steps, and $focusMins focus mins."
                val res = geminiClient.generateResponse(
                    userPrompt = prompt,
                    pendingTasks = pending.map { it.title }
                )
                val aiText = res.getOrNull()?.replyText
                _briefing.value = if (!aiText.isNullOrBlank()) {
                    fallback.copy(greeting = aiText)
                } else {
                    fallback
                }
            } else {
                _briefing.value = fallback
            }
            _isBriefingLoading.value = false
        }
    }

    private fun buildOfflineBriefing(
        pending: List<TaskEntity>,
        steps: Int,
        goal: Int,
        hr: Int,
        focusMins: Int
    ): DailyBriefingState {
        val greeting = when {
            pending.isEmpty() -> "Your agenda is clear today. Great time for a 25-minute Focus sprint or personal review."
            else -> "You have ${pending.size} active task(s) queued and ${focusMins}m focused so far. Stay hydrated and pace your day."
        }
        val priorities = if (pending.isNotEmpty()) {
            pending.take(3).map { "${it.title} (${it.dueTime})" }
        } else {
            listOf("Review Knowledge Vault", "Complete daily hydration goal", "Run a 25m Focus session")
        }
        val pct = ((steps.toFloat() / goal.coerceAtLeast(1)) * 100).toInt()
        val hrText = if (hr > 0) "Resting/active HR is $hr BPM." else "Connect watch for live HR."
        val healthInsight = "Step progress is $pct% ($steps / $goal). $hrText"
        return DailyBriefingState(greeting = greeting, priorities = priorities, healthInsight = healthInsight)
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
