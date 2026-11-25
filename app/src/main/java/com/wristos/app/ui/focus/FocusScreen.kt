package com.wristos.app.ui.focus

import android.app.Application
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.wellness.FocusSessionEntity
import com.wristos.app.ui.theme.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class FocusMode(val label: String, val minutes: Int) {
    POMODORO("Pomodoro", 25),
    SHORT_BREAK("Short Break", 5),
    LONG_BREAK("Long Break", 15),
    DEEP_WORK("Deep Work", 45)
}

data class FocusTimerUiState(
    val mode: FocusMode = FocusMode.POMODORO,
    val totalSeconds: Int = FocusMode.POMODORO.minutes * 60,
    val secondsLeft: Int = FocusMode.POMODORO.minutes * 60,
    val isRunning: Boolean = false,
    val selectedTag: String = "#DeepWork"
)

private object PersistentFocusTimer {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var tickJob: Job? = null

    private val _state = MutableStateFlow(FocusTimerUiState())
    val state: StateFlow<FocusTimerUiState> = _state.asStateFlow()

    fun selectMode(mode: FocusMode) {
        tickJob?.cancel()
        val secs = mode.minutes * 60
        _state.value = _state.value.copy(
            mode = mode,
            totalSeconds = secs,
            secondsLeft = secs,
            isRunning = false
        )
    }

    fun selectTag(tag: String) {
        _state.value = _state.value.copy(selectedTag = tag)
    }

    fun reset() {
        tickJob?.cancel()
        val cur = _state.value
        _state.value = cur.copy(secondsLeft = cur.totalSeconds, isRunning = false)
    }

    fun toggleRunning(onComplete: (FocusMode, String) -> Unit) {
        val cur = _state.value
        if (cur.isRunning) {
            tickJob?.cancel()
            _state.value = cur.copy(isRunning = false)
            return
        }
        _state.value = cur.copy(isRunning = true)
        tickJob?.cancel()
        tickJob = scope.launch {
            while (_state.value.isRunning && _state.value.secondsLeft > 0) {
                delay(1000L)
                val now = _state.value
                if (!now.isRunning) break
                val next = (now.secondsLeft - 1).coerceAtLeast(0)
                if (next == 0) {
                    _state.value = now.copy(secondsLeft = now.totalSeconds, isRunning = false)
                    onComplete(now.mode, now.selectedTag)
                    break
                } else {
                    _state.value = now.copy(secondsLeft = next)
                }
            }
        }
    }
}

class FocusViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = WristOSDatabase.getDatabase(application).focusSessionDao()
    private val ble = BleManagerProvider.getInstance(application)

    val timerState: StateFlow<FocusTimerUiState> = PersistentFocusTimer.state
    val sessions: StateFlow<List<FocusSessionEntity>> = dao.getAllSessions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectMode(mode: FocusMode) = PersistentFocusTimer.selectMode(mode)
    fun selectTag(tag: String) = PersistentFocusTimer.selectTag(tag)
    fun resetTimer() = PersistentFocusTimer.reset()

    fun toggleTimer(onCompletedToast: (String) -> Unit) {
        val wasRunning = timerState.value.isRunning
        val mode = timerState.value.mode
        PersistentFocusTimer.toggleRunning { completedMode, tag ->
            logSession(completedMode, tag)
            onCompletedToast("${completedMode.label} completed!")
        }
        if (!wasRunning) {
            sendStartAlert(mode)
            onCompletedToast("Focus alert pushed to watch")
        }
    }

    fun logSession(mode: FocusMode, tag: String) {
        viewModelScope.launch {
            dao.insertSession(
                FocusSessionEntity(mode = mode.label, tag = tag, durationMinutes = mode.minutes)
            )
            ble.sendAlertNotification("Focus Done", "${mode.label} (${mode.minutes}m) complete")
        }
    }

    fun sendStartAlert(mode: FocusMode) {
        ble.sendAlertNotification("Focus Started", "${mode.label} • ${mode.minutes} mins")
    }
}

@Composable
fun FocusScreen(
    onBack: () -> Unit = {},
    viewModel: FocusViewModel = viewModel()
) {
    val sessions by viewModel.sessions.collectAsState()
    val timerState by viewModel.timerState.collectAsState()
    val palette = LocalWristOSPalette.current

    val selectedMode = timerState.mode
    val totalSeconds = timerState.totalSeconds
    val secondsLeft = timerState.secondsLeft
    val isRunning = timerState.isRunning
    val selectedTag = timerState.selectedTag
    var toastMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(toastMsg) {
        if (toastMsg != null) {
            delay(2500L)
            toastMsg = null
        }
    }

    val mins = secondsLeft / 60
    val secs = secondsLeft % 60
    val formatted = String.format(java.util.Locale.US, "%02d:%02d", mins, secs)
    val progress = 1f - (secondsLeft.toFloat() / totalSeconds.coerceAtLeast(1))
    val totalFocusMins = sessions.sumOf { it.durationMinutes }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(6.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(palette.surfaceElevated)
                        .border(1.dp, palette.border, RoundedCornerShape(12.dp))
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Back", tint = TextSecondary)
                }
                Spacer(modifier = Modifier.width(12.dp))
                AuroraSectionHeader(
                    eyebrow = "DEEP WORK",
                    title = "Focus Timer",
                    trailing = {
                        AuroraPillBadge(text = "${totalFocusMins}m total", color = palette.primary)
                    }
                )
            }

            // Mode Preset Pills
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FocusMode.entries.forEach { mode ->
                    val active = selectedMode == mode
                    Surface(
                        shape = CircleShape,
                        color = if (active) palette.primary.copy(alpha = 0.22f) else palette.surface,
                        border = BorderStroke(1.dp, if (active) palette.primary else palette.border),
                        modifier = Modifier.clickable {
                            viewModel.selectMode(mode)
                        }
                    ) {
                        Text(
                            text = "${mode.label} • ${mode.minutes}m",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (active) palette.primaryVariant else TextSecondary,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                        )
                    }
                }
            }

            // Main Timer Ring Card
            AuroraGlassCard(highlightBorder = isRunning) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(modifier = Modifier.size(210.dp), contentAlignment = Alignment.Center) {
                        Canvas(modifier = Modifier.fillMaxSize().padding(10.dp)) {
                            val sw = 14.dp.toPx()
                            drawArc(
                                color = Color.White.copy(alpha = 0.08f),
                                startAngle = -90f,
                                sweepAngle = 360f,
                                useCenter = false,
                                style = Stroke(width = sw, cap = StrokeCap.Round),
                                size = Size(size.width, size.height)
                            )
                            drawArc(
                                brush = Brush.sweepGradient(listOf(palette.gradStart, palette.gradEnd, Color(0xFF38BDF8), palette.gradStart)),
                                startAngle = -90f,
                                sweepAngle = 360f * progress.coerceAtLeast(0.02f),
                                useCenter = false,
                                style = Stroke(width = sw, cap = StrokeCap.Round),
                                size = Size(size.width, size.height)
                            )
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            AuroraPillBadge(text = selectedMode.label.uppercase(), color = palette.secondary)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = formatted,
                                fontSize = 44.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Black,
                                color = TextPrimary
                            )
                            Text(text = selectedTag, fontSize = 11.sp, color = TextSecondary)
                        }
                    }

                    // Tag chips
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("#DeepWork", "#Study", "#Build", "#Health").forEach { tag ->
                            val active = selectedTag == tag
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (active) palette.secondary.copy(alpha = 0.2f) else palette.surfaceElevated,
                                border = BorderStroke(1.dp, if (active) palette.secondary else palette.border),
                                modifier = Modifier.clickable { viewModel.selectTag(tag) }
                            ) {
                                Text(
                                    text = tag,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (active) palette.secondary else TextSecondary,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { viewModel.resetTimer() },
                            modifier = Modifier
                                .size(48.dp)
                                .background(palette.surfaceElevated, CircleShape)
                                .border(1.dp, palette.border, CircleShape)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Reset", tint = TextSecondary)
                        }

                        AuroraGradientButton(
                            text = if (isRunning) "Pause" else "Start Focus",
                            onClick = {
                                viewModel.toggleTimer { msg -> toastMsg = msg }
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                                    contentDescription = null,
                                    tint = TextPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        )

                        IconButton(
                            onClick = {
                                viewModel.resetTimer()
                                viewModel.logSession(selectedMode, selectedTag)
                                toastMsg = "Logged ${selectedMode.minutes}m session"
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .background(EmeraldSuccess.copy(alpha = 0.16f), CircleShape)
                                .border(1.dp, EmeraldSuccess.copy(alpha = 0.45f), CircleShape)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = "Complete", tint = EmeraldSuccess)
                        }
                    }
                }
            }

            // Recent Sessions
            AuroraGlassCard {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("COMPLETED SESSIONS (${sessions.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary, letterSpacing = 1.2.sp)
                    if (sessions.isEmpty()) {
                        Text("Start a Pomodoro or Deep Work timer above to log focused sessions.", fontSize = 12.sp, color = TextTertiary)
                    } else {
                        sessions.take(5).forEach { s ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(palette.surfaceElevated)
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(s.mode, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    Text(s.tag, fontSize = 11.sp, color = palette.primary)
                                }
                                AuroraPillBadge(text = "${s.durationMinutes}m", color = EmeraldSuccess)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
        }

        if (toastMsg != null) {
            AuroraToastPill(toastMsg ?: "", modifier = Modifier.align(Alignment.TopCenter).padding(top = 10.dp))
        }
    }
}
