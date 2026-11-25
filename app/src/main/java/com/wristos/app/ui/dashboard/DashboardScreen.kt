package com.wristos.app.ui.dashboard

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.navigation.Screen
import com.wristos.app.ui.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private fun getGreetingForHour(hourOfDay: Int): String = when (hourOfDay) {
    in 5..11 -> "Good Morning"
    in 12..16 -> "Good Afternoon"
    in 17..20 -> "Good Evening"
    else -> "Good Night"
}

@Composable
fun DashboardScreen(
    onNavigate: (String) -> Unit = {},
    viewModel: DashboardViewModel = viewModel()
) {
    val watchData by viewModel.watchData.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val pendingTasksCount by viewModel.pendingTasksCount.collectAsState()
    val completedTasksCount by viewModel.completedTasksCount.collectAsState()
    val memoriesCount by viewModel.memoriesCount.collectAsState()
    val habits by viewModel.habits.collectAsState()
    val hydration by viewModel.todayHydration.collectAsState()
    val todayActivity by viewModel.todayActivity.collectAsState()
    val focusSessions by viewModel.focusSessions.collectAsState()
    val briefing by viewModel.briefing.collectAsState()
    val isBriefingLoading by viewModel.isBriefingLoading.collectAsState()
    val userName by viewModel.prefs.userName.collectAsState()
    val dailyGoal by viewModel.prefs.dailyStepGoal.collectAsState()
    val palette = LocalWristOSPalette.current
    val context = LocalContext.current

    val isConnected = watchData.connectionState == WatchConnectionState.CONNECTED
    val isScanning = watchData.connectionState == WatchConnectionState.SCANNING ||
        watchData.connectionState == WatchConnectionState.CONNECTING

    var currentTimeMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var resumeTick by remember { mutableIntStateOf(0) }
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                resumeTick++
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(Unit) {
        while (true) {
            currentTimeMs = System.currentTimeMillis()
            delay(15_000L)
        }
    }

    val cal = remember(currentTimeMs) { Calendar.getInstance().apply { timeInMillis = currentTimeMs } }
    val greeting = getGreetingForHour(cal.get(Calendar.HOUR_OF_DAY))
    val formattedDate = remember(currentTimeMs) {
        SimpleDateFormat("EEEE, d MMM", Locale.getDefault()).format(cal.time)
    }
    val clockStr = remember(currentTimeMs) {
        SimpleDateFormat("HH:mm", Locale.getDefault()).format(cal.time)
    }
    val shortDateStr = remember(currentTimeMs) {
        SimpleDateFormat("EEE d", Locale.getDefault()).format(cal.time)
    }
    val todayKey = remember(currentTimeMs) { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(currentTimeMs)) }

    var toastMessage by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(toastMessage) {
        if (toastMessage != null) {
            delay(2600L)
            toastMessage = null
        }
    }

    var activeModal by remember { mutableStateOf<String?>(null) }
    var modalTitle by remember { mutableStateOf("") }
    var modalSub by remember { mutableStateOf("") }
    var modalTag by remember { mutableStateOf("Personal") }
    var showWatchHubDialog by remember { mutableStateOf(false) }

    val canDrawOverlays = remember(currentTimeMs, resumeTick) { viewModel.bleManager.canDrawOverlaysCompat() }
    val canFullScreen = remember(currentTimeMs, resumeTick) { viewModel.bleManager.canUseFullScreenIntentCompat() }
    val hasMic = remember(currentTimeMs, resumeTick) {
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
    }
    val needsWakeSetup = !canDrawOverlays || !canFullScreen || !hasMic

    val statusDotColor by animateColorAsState(
        targetValue = when (watchData.connectionState) {
            WatchConnectionState.CONNECTED -> EmeraldSuccess
            WatchConnectionState.CONNECTING, WatchConnectionState.SCANNING -> AmberAlert
            WatchConnectionState.DISCONNECTED -> CoralWarning
        },
        label = "statusDot"
    )

    val pendingList = remember(tasks) { tasks.filter { !it.isCompleted }.take(3) }
    val completionPct = if (tasks.isNotEmpty()) ((completedTasksCount.toFloat() / tasks.size) * 100).toInt() else 0

    val steps = if (isConnected) watchData.stepCount else (todayActivity?.steps ?: 0)
    val liveHeartRate = if (isConnected) watchData.heartRate else 0
    val stepProgress = (steps.toFloat() / dailyGoal.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f)
    val calories = (steps * 0.04f).toInt()
    val distanceKm = String.format(Locale.getDefault(), "%.1f", steps * 0.00075f)

    val waterMl = hydration?.amountMl ?: 0
    val waterGoal = hydration?.goalMl ?: 2500
    val waterPct = ((waterMl.toFloat() / waterGoal.coerceAtLeast(1)) * 100).toInt().coerceIn(0, 100)
    val totalFocusMins = focusSessions.sumOf { it.durationMinutes }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(6.dp))

            // 1. WEB-MATCHED HERO GREETING HEADER
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "$greeting,\n${userName.split(" ").firstOrNull() ?: "Gaurav"}",
                        fontSize = 27.sp,
                        lineHeight = 31.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(5.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = formattedDate,
                            fontSize = 12.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(text = "  •  ", fontSize = 12.sp, color = TextTertiary)
                        Text(
                            text = "Intelligence Hub",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            style = TextStyle(
                                brush = Brush.linearGradient(listOf(palette.primaryVariant, palette.secondary))
                            )
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    IconButton(
                        onClick = {
                            viewModel.sendTestAlert("Focus Reminder • WristOS")
                            toastMessage = if (isConnected) "Haptic alert sent to WatchOS" else "Connect watch first to alert"
                        },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(palette.surface.copy(alpha = 0.9f))
                            .border(1.dp, palette.border, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Alert Watch",
                            tint = TextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .shadow(10.dp, CircleShape, ambientColor = palette.gradEnd.copy(alpha = 0.4f))
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(palette.gradStart, palette.gradEnd)))
                            .border(1.5.dp, Color.White.copy(alpha = 0.28f), CircleShape)
                            .clickable { onNavigate(Screen.Settings.route) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = userName.firstOrNull()?.uppercase() ?: "G",
                            color = TextPrimary,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp
                        )
                    }
                }
            }

            // 2. WATCH AI WAKE SETUP BANNER (if lockscreen/background wake permissions need approval)
            if (needsWakeSetup) {
                AuroraGlassCard(
                    cornerRadius = 18.dp,
                    highlightBorder = true,
                    accentGlow = palette.secondary,
                    onClick = {
                        when {
                            !canFullScreen && Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> {
                                context.startActivity(
                                    Intent(
                                        Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                                        Uri.parse("package:${context.packageName}")
                                    )
                                )
                            }
                            !canDrawOverlays -> {
                                context.startActivity(
                                    Intent(
                                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                        Uri.parse("package:${context.packageName}")
                                    )
                                )
                            }
                            else -> onNavigate(Screen.Settings.route)
                        }
                    }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 11.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(palette.secondary.copy(alpha = 0.18f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Enable Watch → Phone AI Wake",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = when {
                                    !canFullScreen -> "Allow Full-Screen Wake so watch opens AI over lockscreen"
                                    !canDrawOverlays -> "Allow 'Appear on top' so watch opens mic over any app"
                                    else -> "Allow Microphone permission for watch voice trigger"
                                },
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                        }
                        AuroraPillBadge(text = "Fix →", color = palette.secondary)
                    }
                }
            }

            // 3. TWILIGHT SUNSET MOUNTAIN WATCH HERO CARD (Web Artwork Match)
            Surface(
                shape = RoundedCornerShape(26.dp),
                color = palette.surface,
                border = BorderStroke(
                    1.2.dp,
                    Brush.linearGradient(
                        listOf(
                            if (isConnected) palette.gradStart else palette.border,
                            if (isConnected) palette.gradEnd else palette.border
                        )
                    )
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(16.dp, RoundedCornerShape(26.dp), ambientColor = palette.gradStart.copy(alpha = 0.25f))
                    .clickable { showWatchHubDialog = true }
            ) {
                Box(modifier = Modifier.fillMaxWidth().height(108.dp)) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        drawRect(
                            brush = Brush.verticalGradient(
                                listOf(Color(0xFF140C26), Color(0xFF22133D), Color(0xFF4F2445), Color(0xFFD97757))
                            )
                        )
                        drawCircle(
                            color = Color(0xFFF59E0B).copy(alpha = 0.28f),
                            radius = size.height * 0.68f,
                            center = Offset(size.width * 0.55f, size.height * 0.98f)
                        )
                        val ridge1 = Path().apply {
                            moveTo(0f, size.height * 0.78f)
                            lineTo(size.width * 0.18f, size.height * 0.56f)
                            lineTo(size.width * 0.36f, size.height * 0.72f)
                            lineTo(size.width * 0.56f, size.height * 0.50f)
                            lineTo(size.width * 0.78f, size.height * 0.70f)
                            lineTo(size.width, size.height * 0.56f)
                            lineTo(size.width, size.height)
                            lineTo(0f, size.height)
                            close()
                        }
                        drawPath(ridge1, Brush.verticalGradient(listOf(Color(0xFF2E1742), Color(0xFF140920))))
                        val ridge2 = Path().apply {
                            moveTo(0f, size.height * 0.87f)
                            lineTo(size.width * 0.24f, size.height * 0.70f)
                            lineTo(size.width * 0.45f, size.height * 0.84f)
                            lineTo(size.width * 0.72f, size.height * 0.65f)
                            lineTo(size.width, size.height * 0.82f)
                            lineTo(size.width, size.height)
                            lineTo(0f, size.height)
                            close()
                        }
                        drawPath(ridge2, Brush.verticalGradient(listOf(Color(0xFF190A29), Color(0xFF090311))))
                    }

                    Row(
                        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0A0614).copy(alpha = 0.90f))
                                    .border(2.dp, Color.White.copy(alpha = 0.28f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("WristOS", fontSize = 7.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                                    Text(clockStr, fontSize = 14.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Black, color = TextPrimary)
                                    Text(shortDateStr, fontSize = 7.sp, color = palette.secondary, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = watchData.deviceName,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 16.sp,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(8.dp).background(statusDotColor, CircleShape))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = when (watchData.connectionState) {
                                            WatchConnectionState.CONNECTED -> "Connected • ${watchData.batteryLevel}%"
                                            WatchConnectionState.SCANNING -> watchData.statusMessage ?: "Scanning BLE..."
                                            WatchConnectionState.CONNECTING -> "Linking Watch..."
                                            WatchConnectionState.DISCONNECTED -> watchData.statusMessage ?: "Disconnected"
                                        },
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        color = Color.White.copy(alpha = 0.90f),
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = if (isConnected) CoralWarning.copy(alpha = 0.24f) else Color.White.copy(alpha = 0.16f),
                            border = BorderStroke(
                                1.dp,
                                if (isConnected) CoralWarning.copy(alpha = 0.45f) else Color.White.copy(alpha = 0.28f)
                            ),
                            modifier = Modifier.clickable(enabled = !isScanning) {
                                if (isConnected) viewModel.disconnectWatch() else viewModel.connectWatch()
                            }
                        ) {
                            Text(
                                text = when {
                                    isScanning -> "Linking"
                                    isConnected -> "Unlink"
                                    else -> "Connect"
                                },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isConnected) CoralWarning else TextPrimary,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp)
                            )
                        }
                    }
                }
            }

            // 4. 6 QUICK ACTION BUTTONS GRID (Exact Match to Web Dashboard!)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    QuickActionTile("Ask AI", Icons.Default.AutoAwesome, Color(0xFFE879F9), Modifier.weight(1f)) {
                        onNavigate(Screen.Assistant.route)
                    }
                    QuickActionTile("Add Task", Icons.Default.CheckBox, Color(0xFF818CF8), Modifier.weight(1f)) {
                        modalTitle = ""; modalSub = "Today, 6:00 PM"; activeModal = "task"
                    }
                    QuickActionTile("Reminder", Icons.Default.Notifications, AmberAlert, Modifier.weight(1f)) {
                        modalTitle = ""; modalSub = "In 30 minutes"; activeModal = "reminder"
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    QuickActionTile("Save Memory", Icons.Default.Psychology, palette.secondary, Modifier.weight(1f)) {
                        modalTitle = ""; modalTag = "Personal"; activeModal = "memory"
                    }
                    QuickActionTile("Focus", Icons.Default.Timer, palette.primary, Modifier.weight(1f)) {
                        onNavigate(Screen.Focus.route)
                    }
                    QuickActionTile("Health", Icons.Default.Favorite, Color(0xFFFB7185), Modifier.weight(1f)) {
                        onNavigate(Screen.Health.route)
                    }
                }
            }

            // 5. AI DAILY INTELLIGENCE BRIEFING CARD (Matches Web Dashboard!)
            AuroraGlassCard(highlightBorder = briefing != null) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(7.dp))
                            Text(
                                text = "AI DAILY INTELLIGENCE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 1.1.sp,
                                color = palette.primaryVariant
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = palette.primary.copy(alpha = 0.16f),
                            border = BorderStroke(1.dp, palette.primary.copy(alpha = 0.38f)),
                            modifier = Modifier.clickable(enabled = !isBriefingLoading) {
                                viewModel.generateDailyBriefing()
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = if (isBriefingLoading) "Thinking..." else if (briefing != null) "Refresh" else "Get Briefing",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = palette.primaryVariant
                                )
                            }
                        }
                    }

                    val activeBriefing = briefing
                    if (activeBriefing != null) {
                        Text(text = activeBriefing.greeting, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary, lineHeight = 19.sp)
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(palette.bgPrimary.copy(alpha = 0.7f))
                                .border(1.dp, palette.border.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Text("KEY PRIORITIES", fontSize = 10.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = palette.secondary)
                            activeBriefing.priorities.forEach { item ->
                                Text("•  $item", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                        Text(text = activeBriefing.healthInsight, fontSize = 11.sp, color = palette.primaryVariant, fontWeight = FontWeight.Medium)
                    } else {
                        Text(
                            text = "Synthesize your ${pendingTasksCount} pending tasks, $memoriesCount vault facts, and watch metrics with Gemini / Smart Engine.",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // 6. ACTIVITY & HEALTH CARD (True 180° Semi-Circular Arc Gauge matching Web!)
            AuroraGlassCard(onClick = { onNavigate(Screen.Health.route) }) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.AutoMirrored.Filled.DirectionsWalk, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Activity & Health", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(16.dp))
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = palette.surfaceElevated,
                            border = BorderStroke(1.dp, palette.border),
                            modifier = Modifier.clickable {
                                if (isConnected) viewModel.syncTelemetry() else viewModel.connectWatch()
                                toastMessage = if (isConnected) "Syncing telemetry..." else "Searching for PineTime..."
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, tint = palette.primary, modifier = Modifier.size(12.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (isConnected) "Sync Watch" else "Connect", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.primaryVariant)
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // True 180° Semi-Circular Arc Gauge (matches Web SVG)
                        Box(
                            modifier = Modifier.width(136.dp).height(90.dp),
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            Canvas(modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp, vertical = 8.dp)) {
                                val sw = 12.dp.toPx()
                                val arcSize = Size(size.width, size.width)
                                drawArc(
                                    color = Color.White.copy(alpha = 0.08f),
                                    startAngle = 180f,
                                    sweepAngle = 180f,
                                    useCenter = false,
                                    style = Stroke(width = sw, cap = StrokeCap.Round),
                                    size = arcSize
                                )
                                drawArc(
                                    brush = Brush.horizontalGradient(listOf(Color(0xFF38BDF8), palette.gradStart, palette.gradEnd)),
                                    startAngle = 180f,
                                    sweepAngle = if (stepProgress > 0f) 180f * stepProgress.coerceAtLeast(0.04f) else 0f,
                                    useCenter = false,
                                    style = Stroke(width = sw, cap = StrokeCap.Round),
                                    size = arcSize
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(bottom = 2.dp)) {
                                Text(
                                    text = "%,d".format(steps),
                                    fontSize = 22.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Black,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Steps (Goal: ${dailyGoal / 1000}k)",
                                    fontSize = 10.sp,
                                    color = TextSecondary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            BiometricMiniRow(
                                icon = Icons.Default.Favorite,
                                label = "Heart Rate",
                                value = if (liveHeartRate > 0) "$liveHeartRate bpm" else "-- bpm",
                                accent = Color(0xFFF43F5E)
                            )
                            BiometricMiniRow(
                                icon = Icons.Default.LocalFireDepartment,
                                label = "Calories",
                                value = "$calories kcal",
                                accent = AmberAlert
                            )
                            BiometricMiniRow(
                                icon = Icons.Default.Map,
                                label = "Distance",
                                value = "$distanceKm km",
                                accent = Color(0xFF38BDF8)
                            )
                        }
                    }
                }
            }

            // 7. DAILY HYDRATION LOGGER CARD (Matches Web Dashboard!)
            AuroraGlassCard(accentGlow = Color(0xFF38BDF8)) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.WaterDrop, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Daily Hydration", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                        }
                        Text(
                            text = "$waterMl / $waterGoal ml ($waterPct%)",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF7DD3FC)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(9.dp)
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
                            text = if (waterMl >= waterGoal) "Hydration goal reached!" else "${waterGoal - waterMl} ml remaining today",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            WaterQuickChip("+250ml") {
                                viewModel.addWater(250)
                                toastMessage = "Added 250ml water intake"
                            }
                            WaterQuickChip("+500ml") {
                                viewModel.addWater(500)
                                toastMessage = "Added 500ml water intake"
                            }
                        }
                    }
                }
            }

            // 8. TASKS & REMINDERS PROGRESS CARD (Matches Web Dashboard!)
            AuroraGlassCard {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { onNavigate(Screen.Tasks.route) }
                        ) {
                            Icon(Icons.Default.CheckBox, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Tasks & Reminders", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                        }
                        Text(
                            text = "View All →",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.primary,
                            modifier = Modifier.clickable { onNavigate(Screen.Tasks.route) }
                        )
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(
                            text = "$completedTasksCount of ${tasks.size} completed",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                        Text(
                            text = "$completionPct%",
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.ExtraBold,
                            color = palette.primaryVariant
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape)
                            .background(palette.surfaceElevated)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxHeight()
                                .fillMaxWidth(completionPct / 100f)
                                .clip(CircleShape)
                                .background(Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd)))
                        )
                    }

                    if (pendingList.isEmpty()) {
                        Text(
                            text = "Agenda clear! Tap 'Add Task' above or trigger Watch AI.",
                            fontSize = 12.sp,
                            color = TextTertiary
                        )
                    } else {
                        pendingList.forEach { task ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(palette.bgPrimary.copy(alpha = 0.6f))
                                    .border(1.dp, palette.border.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                                    .clickable { viewModel.toggleTask(task) }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clip(RoundedCornerShape(5.dp))
                                        .background(if (task.isCompleted) palette.secondary else Color.Transparent)
                                        .border(1.8.dp, palette.primary, RoundedCornerShape(5.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (task.isCompleted) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(12.dp))
                                    }
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = task.title,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (task.isCompleted) TextTertiary else TextPrimary,
                                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = task.dueTime,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }
            }

            // 9. HABITS & STREAKS CARD (Matches Web Dashboard!)
            AuroraGlassCard(accentGlow = EmeraldSuccess) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    val doneCount = habits.count { it.lastCompletedDate == todayKey }
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
                        Text(
                            text = "$doneCount of ${habits.size} Done",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldSuccess
                        )
                    }

                    habits.forEach { habit ->
                        val isDone = habit.lastCompletedDate == todayKey
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(palette.bgPrimary.copy(alpha = 0.6f))
                                .border(
                                    1.dp,
                                    if (isDone) EmeraldSuccess.copy(alpha = 0.45f) else palette.border.copy(alpha = 0.5f),
                                    RoundedCornerShape(14.dp)
                                )
                                .clickable {
                                    viewModel.toggleHabit(habit)
                                    toastMessage = "Habit progress updated"
                                }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (isDone) EmeraldSuccess else Color.Transparent)
                                        .border(1.8.dp, if (isDone) EmeraldSuccess else TextTertiary, RoundedCornerShape(6.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (isDone) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF06040D), modifier = Modifier.size(12.dp))
                                    }
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = habit.title,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isDone) TextTertiary else TextPrimary,
                                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None
                                )
                            }
                            Text(
                                text = "${habit.streakCount} days",
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = AmberAlert
                            )
                        }
                    }
                }
            }

            // 10. FOCUS & KNOWLEDGE VAULT SUMMARY CARDS
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                AuroraGlassCard(
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.Focus.route) }
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(palette.primary.copy(alpha = 0.16f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Timer, contentDescription = null, tint = palette.primary, modifier = Modifier.size(18.dp))
                        }
                        Text("Focus & Deep Work", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("${focusSessions.size} sessions • ${totalFocusMins}m", fontSize = 11.sp, color = TextSecondary)
                    }
                }

                AuroraGlassCard(
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.Memory.route) }
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(palette.secondary.copy(alpha = 0.16f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Psychology, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(18.dp))
                        }
                        Text("Knowledge Vault", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("$memoriesCount stored facts", fontSize = 11.sp, color = TextSecondary)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
        }

        AnimatedVisibility(
            visible = toastMessage != null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 10.dp)
        ) {
            AuroraToastPill(message = toastMessage ?: "")
        }
    }

    if (activeModal != null) {
        val isTask = activeModal == "task"
        val isReminder = activeModal == "reminder"
        val titleText = when (activeModal) {
            "task" -> "Quick Add Task"
            "reminder" -> "Schedule Watch Reminder"
            else -> "Save to Knowledge Vault"
        }

        AlertDialog(
            onDismissRequest = { activeModal = null },
            containerColor = palette.surfaceElevated,
            title = { Text(titleText, color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (activeModal == "memory") {
                        OutlinedTextField(
                            value = modalTag,
                            onValueChange = { modalTag = it },
                            label = { Text("Category (Health, Work, Hardware)") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = modalTitle,
                            onValueChange = { modalTitle = it },
                            label = { Text("Fact to remember") },
                            maxLines = 3
                        )
                    } else {
                        OutlinedTextField(
                            value = modalTitle,
                            onValueChange = { modalTitle = it },
                            label = { Text(if (isReminder) "Reminder message" else "Task title") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = modalSub,
                            onValueChange = { modalSub = it },
                            label = { Text(if (isReminder) "When" else "Due time") },
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        when (activeModal) {
                            "task" -> if (modalTitle.isNotBlank()) {
                                viewModel.addQuickTask(modalTitle, modalSub)
                                toastMessage = "Task added"
                            }
                            "reminder" -> if (modalTitle.isNotBlank()) {
                                viewModel.addQuickReminder(modalTitle, modalSub)
                                toastMessage = "Reminder saved & alerted"
                            }
                            "memory" -> if (modalTitle.isNotBlank()) {
                                viewModel.addQuickMemory(modalTag, modalTitle)
                                toastMessage = "Saved to Knowledge Vault"
                            }
                        }
                        activeModal = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D))
                ) {
                    Text(if (isTask) "Add Task" else if (isReminder) "Set & Alert" else "Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { activeModal = null }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    if (showWatchHubDialog) {
        AlertDialog(
            onDismissRequest = { showWatchHubDialog = false },
            containerColor = palette.surfaceElevated,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.size(10.dp).background(statusDotColor, CircleShape))
                    Text(watchData.deviceName, color = TextPrimary, fontWeight = FontWeight.ExtraBold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = when (watchData.connectionState) {
                            WatchConnectionState.CONNECTED -> "BLE Live • Battery ${watchData.batteryLevel}% • ${watchData.stepCount} steps"
                            WatchConnectionState.SCANNING -> watchData.statusMessage ?: "Scanning for watch..."
                            WatchConnectionState.CONNECTING -> "Establishing GATT link..."
                            WatchConnectionState.DISCONNECTED -> watchData.statusMessage ?: "Not connected"
                        },
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    AuroraGradientButton(
                        text = if (isConnected) "Sync Time & Telemetry" else "Scan & Connect Watch",
                        onClick = {
                            if (isConnected) viewModel.syncTelemetry() else viewModel.connectWatch()
                            toastMessage = if (isConnected) "Synced time, battery & steps" else "Scanning for WristOS..."
                            showWatchHubDialog = false
                        }
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = {
                                viewModel.sendTestAlert("Find Watch • WristOS")
                                toastMessage = if (isConnected) "Buzzed watch" else "Connect watch first"
                                showWatchHubDialog = false
                            },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(1.dp, palette.border)
                        ) {
                            Text("Buzz Watch", fontSize = 11.sp, color = TextPrimary)
                        }
                        OutlinedButton(
                            onClick = {
                                showWatchHubDialog = false
                                onNavigate(Screen.Settings.route)
                            },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(1.dp, palette.border)
                        ) {
                            Text("AI Wake Setup", fontSize = 11.sp, color = palette.primary)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showWatchHubDialog = false }) {
                    Text("Close", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
private fun QuickActionTile(
    label: String,
    icon: ImageVector,
    iconTint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    AuroraGlassCard(
        modifier = modifier,
        cornerRadius = 18.dp,
        accentGlow = iconTint,
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(iconTint.copy(alpha = 0.14f), RoundedCornerShape(10.dp))
                    .border(1.dp, iconTint.copy(alpha = 0.25f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = label, tint = iconTint, modifier = Modifier.size(17.dp))
            }
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun BiometricMiniRow(
    icon: ImageVector,
    label: String,
    value: String,
    accent: Color
) {
    val palette = LocalWristOSPalette.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(palette.bgPrimary.copy(alpha = 0.55f))
            .border(1.dp, palette.border.copy(alpha = 0.45f), RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = accent, modifier = Modifier.size(14.dp))
            Spacer(modifier = Modifier.width(7.dp))
            Text(text = label, fontSize = 11.sp, color = TextSecondary)
        }
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = TextPrimary
        )
    }
}

@Composable
private fun WaterQuickChip(label: String, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(11.dp),
        color = Color(0xFF0284C7).copy(alpha = 0.20f),
        border = BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.42f)),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF7DD3FC),
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
        )
    }
}
