package com.wristos.app.ui.health

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsWalk
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
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.navigation.Screen
import com.wristos.app.ui.dashboard.DashboardViewModel
import com.wristos.app.ui.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HealthScreen(
    onNavigate: (String) -> Unit = {},
    viewModel: DashboardViewModel = viewModel()
) {
    val watchData by viewModel.watchData.collectAsState()
    val dailyGoal by viewModel.prefs.dailyStepGoal.collectAsState()
    val habits by viewModel.habits.collectAsState()
    val hydration by viewModel.todayHydration.collectAsState()
    val todayActivity by viewModel.todayActivity.collectAsState()
    val palette = LocalWristOSPalette.current

    val isConnected = watchData.connectionState == WatchConnectionState.CONNECTED
    val todayKey = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
    var subTab by remember { mutableStateOf("overview") } // overview | biometrics | wellness
    var showGoalDialog by remember { mutableStateOf(false) }
    var goalInput by remember(dailyGoal) { mutableStateOf(dailyGoal.toString()) }
    var showWaterGoalDialog by remember { mutableStateOf(false) }
    var waterGoalInput by remember(hydration?.goalMl) { mutableStateOf((hydration?.goalMl ?: 2500).toString()) }
    var showAddHabitDialog by remember { mutableStateOf(false) }
    var newHabitTitle by remember { mutableStateOf("") }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(toastMsg) {
        if (toastMsg != null) {
            delay(2400L)
            toastMsg = null
        }
    }

    val steps = if (isConnected) watchData.stepCount else (todayActivity?.steps ?: 0)
    val hasSyncedToday = isConnected || (todayActivity?.lastSyncedAt ?: 0L) > 0L
    val stepProgress = (steps.toFloat() / dailyGoal.coerceAtLeast(1)).coerceIn(0f, 1f)
    val calories = (steps * 0.04f).toInt()
    val distanceKm = String.format(Locale.getDefault(), "%.1f", steps * 0.00075f)
    val hr = if (isConnected && watchData.heartRate > 0) watchData.heartRate else 0

    val waterMl = hydration?.amountMl ?: 0
    val waterGoal = hydration?.goalMl ?: 2500
    val waterPct = ((waterMl.toFloat() / waterGoal.coerceAtLeast(1)) * 100).toInt().coerceIn(0, 100)

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(6.dp))

            AuroraSectionHeader(
                eyebrow = "BIOMETRIC HUB",
                title = "Health & Wellness",
                trailing = {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = palette.surfaceElevated,
                        border = BorderStroke(1.dp, palette.border),
                        modifier = Modifier.clickable {
                            if (isConnected) viewModel.syncTelemetry() else viewModel.connectWatch()
                            toastMsg = if (isConnected) "Syncing watch metrics..." else "Scanning for PineTime..."
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, tint = palette.primary, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(if (isConnected) "Sync" else "Link", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.primary)
                        }
                    }
                }
            )

            // Sub-tab segmented switcher (matches Web HealthScreen)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(palette.surface)
                    .border(1.dp, palette.border, RoundedCornerShape(16.dp))
                    .padding(4.dp)
            ) {
                listOf("overview" to "Overview", "biometrics" to "Heart & Steps", "wellness" to "Hydration & Habits").forEach { (id, label) ->
                    val active = subTab == id
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (active) Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd))
                                else Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                            )
                            .clickable { subTab = id }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (active) TextPrimary else TextTertiary,
                            maxLines = 1
                        )
                    }
                }
            }

            if (subTab == "overview" || subTab == "biometrics") {
                // Full Circular Activity Ring Card
                AuroraGlassCard(highlightBorder = true) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.AutoMirrored.Filled.DirectionsWalk, contentDescription = null, tint = palette.primary, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Daily Activity Ring", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            }
                            Text(
                                text = "Edit Goal →",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = palette.secondary,
                                modifier = Modifier.clickable { showGoalDialog = true }
                            )
                        }

                        Box(modifier = Modifier.size(168.dp), contentAlignment = Alignment.Center) {
                            Canvas(modifier = Modifier.fillMaxSize().padding(10.dp)) {
                                val sw = 15.dp.toPx()
                                drawArc(
                                    color = Color.White.copy(alpha = 0.08f),
                                    startAngle = -90f,
                                    sweepAngle = 360f,
                                    useCenter = false,
                                    style = Stroke(width = sw, cap = StrokeCap.Round),
                                    size = Size(size.width, size.height)
                                )
                                drawArc(
                                    brush = Brush.sweepGradient(listOf(Color(0xFF38BDF8), palette.gradStart, palette.gradEnd, Color(0xFF38BDF8))),
                                    startAngle = -90f,
                                    sweepAngle = if (stepProgress > 0f) 360f * stepProgress.coerceAtLeast(0.03f) else 0f,
                                    useCenter = false,
                                    style = Stroke(width = sw, cap = StrokeCap.Round),
                                    size = Size(size.width, size.height)
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = if (hasSyncedToday) "%,d".format(steps) else "--",
                                    fontSize = 28.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Black,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "/ %,d steps".format(dailyGoal),
                                    fontSize = 11.sp,
                                    color = TextSecondary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                AuroraPillBadge(text = "${(stepProgress * 100).toInt()}%", color = palette.primary)
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            HealthStatTile("Heart Rate", if (hr > 0) "$hr BPM" else "-- BPM", Icons.Default.Favorite, Color(0xFFF43F5E), Modifier.weight(1f))
                            HealthStatTile("Burn", if (hasSyncedToday) "$calories kcal" else "--", Icons.Default.LocalFireDepartment, AmberAlert, Modifier.weight(1f))
                            HealthStatTile("Distance", if (hasSyncedToday) "$distanceKm km" else "--", Icons.Default.Map, Color(0xFF38BDF8), Modifier.weight(1f))
                        }
                    }
                }

                // Heart Rate Zones Card
                AuroraGlassCard {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.MonitorHeart, contentDescription = null, tint = Color(0xFFF43F5E), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Heart Rate Zone", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            }
                            AuroraPillBadge(
                                text = when {
                                    hr == 0 -> "STANDBY"
                                    hr < 90 -> "RESTING"
                                    hr < 125 -> "FAT BURN"
                                    else -> "CARDIO"
                                },
                                color = Color(0xFFF43F5E)
                            )
                        }
                        Text(
                            text = if (hr > 0) "Live optical PPG sensor streaming $hr BPM from PineTime." else "Open Heart Rate on your watch or stay connected for live readings.",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            if (subTab == "overview" || subTab == "wellness") {
                // Daily Hydration Card
                AuroraGlassCard(accentGlow = Color(0xFF38BDF8)) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.WaterDrop, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Daily Hydration", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                            }
                            Text(
                                text = "$waterMl / $waterGoal ml ($waterPct%) ✎",
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF38BDF8),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable {
                                        waterGoalInput = waterGoal.toString()
                                        showWaterGoalDialog = true
                                    }
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(10.dp)
                                .clip(CircleShape)
                                .background(palette.surfaceElevated)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(waterPct / 100f)
                                    .clip(CircleShape)
                                    .background(Brush.horizontalGradient(listOf(Color(0xFF0284C7), Color(0xFF38BDF8), Color(0xFF2DD4BF))))
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (waterMl >= waterGoal) "Daily hydration goal achieved!" else "${waterGoal - waterMl} ml remaining",
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                HydrationChip("+250ml") {
                                    viewModel.addWater(250)
                                    toastMsg = "Added 250ml water"
                                }
                                HydrationChip("+500ml") {
                                    viewModel.addWater(500)
                                    toastMsg = "Added 500ml water"
                                }
                            }
                        }
                    }
                }

                // Habits & Streaks Card
                AuroraGlassCard(accentGlow = EmeraldSuccess) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        val doneToday = habits.count { it.lastCompletedDate == todayKey }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EmeraldSuccess, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Habits & Streaks", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                AuroraPillBadge(text = "$doneToday / ${habits.size}", color = EmeraldSuccess)
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = EmeraldSuccess.copy(alpha = 0.16f),
                                    border = BorderStroke(1.dp, EmeraldSuccess.copy(alpha = 0.4f)),
                                    modifier = Modifier.clickable {
                                        newHabitTitle = ""
                                        showAddHabitDialog = true
                                    }
                                ) {
                                    Text(
                                        text = "+ Habit",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = EmeraldSuccess,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        habits.forEach { habit ->
                            val isDone = habit.lastCompletedDate == todayKey
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(palette.surfaceElevated.copy(alpha = 0.75f))
                                    .border(
                                        1.dp,
                                        if (isDone) EmeraldSuccess.copy(alpha = 0.45f) else palette.border.copy(alpha = 0.5f),
                                        RoundedCornerShape(14.dp)
                                    )
                                    .clickable {
                                        viewModel.toggleHabit(habit)
                                        toastMsg = if (isDone) "Unchecked habit" else "Habit streak updated!"
                                    }
                                    .padding(horizontal = 12.dp, vertical = 11.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isDone) EmeraldSuccess else Color.Transparent)
                                            .border(1.5.dp, if (isDone) EmeraldSuccess else TextTertiary, RoundedCornerShape(6.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (isDone) {
                                            Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF06040D), modifier = Modifier.size(13.dp))
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = habit.title,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isDone) TextSecondary else TextPrimary
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(
                                        text = "${habit.streakCount}d",
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold,
                                        color = AmberAlert
                                    )
                                    IconButton(
                                        onClick = {
                                            viewModel.deleteHabit(habit)
                                            toastMsg = "Removed habit"
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.DeleteOutline,
                                            contentDescription = "Delete habit",
                                            tint = TextTertiary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Shortcut to Focus Timer
            AuroraGlassCard(onClick = { onNavigate(Screen.Focus.route) }) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(palette.primary.copy(alpha = 0.16f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Timer, contentDescription = null, tint = palette.primary, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Focus & Pomodoro Timer", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text("Launch deep work sessions with watch sync", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
        }

        if (toastMsg != null) {
            AuroraToastPill(
                message = toastMsg ?: "",
                modifier = Modifier.align(Alignment.TopCenter).padding(top = 10.dp)
            )
        }
    }

    if (showGoalDialog) {
        AlertDialog(
            onDismissRequest = { showGoalDialog = false },
            containerColor = palette.surfaceElevated,
            title = { Text("Update Daily Step Goal", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = goalInput,
                    onValueChange = { goalInput = it.filter(Char::isDigit) },
                    label = { Text("Target Steps") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        goalInput.toIntOrNull()?.let { viewModel.prefs.setDailyStepGoal(it) }
                        showGoalDialog = false
                        toastMsg = "Step goal updated"
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D))
                ) { Text("Save") }
            },
            dismissButton = {
                TextButton(onClick = { showGoalDialog = false }) { Text("Cancel", color = TextSecondary) }
            }
        )
    }

    if (showWaterGoalDialog) {
        AlertDialog(
            onDismissRequest = { showWaterGoalDialog = false },
            containerColor = palette.surfaceElevated,
            title = { Text("Daily Hydration Goal", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = waterGoalInput,
                    onValueChange = { waterGoalInput = it.filter(Char::isDigit) },
                    label = { Text("Target milliliters (ml)") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        waterGoalInput.toIntOrNull()?.let { viewModel.setWaterGoal(it) }
                        showWaterGoalDialog = false
                        toastMsg = "Hydration goal updated"
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D))
                ) { Text("Save") }
            },
            dismissButton = {
                TextButton(onClick = { showWaterGoalDialog = false }) { Text("Cancel", color = TextSecondary) }
            }
        )
    }

    if (showAddHabitDialog) {
        AlertDialog(
            onDismissRequest = { showAddHabitDialog = false },
            containerColor = palette.surfaceElevated,
            title = { Text("New Daily Habit", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = newHabitTitle,
                    onValueChange = { newHabitTitle = it },
                    label = { Text("Habit name (e.g. Evening Stretch 15m)") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newHabitTitle.isNotBlank()) {
                            viewModel.addHabit(newHabitTitle)
                            newHabitTitle = ""
                            showAddHabitDialog = false
                            toastMsg = "Habit added"
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D))
                ) { Text("Add Habit") }
            },
            dismissButton = {
                TextButton(onClick = { showAddHabitDialog = false }) { Text("Cancel", color = TextSecondary) }
            }
        )
    }
}

@Composable
private fun HealthStatTile(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Color,
    modifier: Modifier = Modifier
) {
    val palette = LocalWristOSPalette.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(palette.surfaceElevated.copy(alpha = 0.85f))
            .border(1.dp, accent.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .padding(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(16.dp))
        Text(value, fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
        Text(label, fontSize = 10.sp, color = TextTertiary)
    }
}

@Composable
private fun HydrationChip(label: String, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFF0284C7).copy(alpha = 0.2f),
        border = BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.45f)),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF7DD3FC),
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        )
    }
}
