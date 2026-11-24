package com.wristos.app.ui.dashboard

import android.content.Intent
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.navigation.Screen
import com.wristos.app.ui.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Calendar
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
    val memoriesCount by viewModel.memoriesCount.collectAsState()
    val userName by viewModel.prefs.userName.collectAsState()
    val dailyGoal by viewModel.prefs.dailyStepGoal.collectAsState()
    val palette = LocalWristOSPalette.current
    val context = LocalContext.current

    val isConnected = watchData.connectionState == WatchConnectionState.CONNECTED
    val isScanning = watchData.connectionState == WatchConnectionState.SCANNING ||
        watchData.connectionState == WatchConnectionState.CONNECTING

    var currentTimeMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
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

    val canDrawOverlays = remember(currentTimeMs) {
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)
    }

    val statusDotColor by animateColorAsState(
        targetValue = when (watchData.connectionState) {
            WatchConnectionState.CONNECTED -> EmeraldSuccess
            WatchConnectionState.CONNECTING, WatchConnectionState.SCANNING -> AmberAlert
            WatchConnectionState.DISCONNECTED -> CoralWarning
        },
        label = "statusDot"
    )

    val pendingList = remember(tasks) { tasks.filter { !it.isCompleted }.take(3) }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(6.dp))

            // 1. TOP HEADER (Greeting + Date + Bell + Avatar)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "$greeting,\n${userName.split(" ").firstOrNull() ?: "Gaurav"}",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary,
                        lineHeight = 32.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = formattedDate,
                            fontSize = 12.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(text = "  •  ", fontSize = 12.sp, color = TextTertiary)
                        Text(
                            text = "INTELLIGENCE HUB",
                            style = MaterialTheme.typography.labelSmall.copy(
                                brush = Brush.linearGradient(listOf(palette.primary, palette.secondary))
                            ),
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
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
                            toastMessage = if (isConnected) "Haptic alert sent to Watch" else "Connect watch first to alert"
                        },
                        modifier = Modifier
                            .size(40.dp)
                            .background(palette.surface, CircleShape)
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
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(palette.gradStart, palette.gradEnd)))
                            .border(1.5.dp, Color.White.copy(alpha = 0.25f), CircleShape)
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

            // Optional 1-tap permission banner for instant AI popup over ANY app
            if (!canDrawOverlays) {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = palette.surfaceElevated,
                    border = BorderStroke(1.dp, palette.secondary.copy(alpha = 0.45f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val intent = Intent(
                                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                Uri.parse("package:${context.packageName}")
                            )
                            context.startActivity(intent)
                        }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = palette.secondary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Enable Background Watch AI Wake",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Allow 'Appear on top' so watch opens AI even over other apps",
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                        }
                        Text(
                            text = "Enable →",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.secondary
                        )
                    }
                }
            }

            // 2. WRISTOS TWILIGHT MOUNTAIN WATCH BANNER CARD (matches web artwork!)
            Surface(
                shape = RoundedCornerShape(24.dp),
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
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(104.dp)
                ) {
                    // Sunset Twilight & Layered Mountains Canvas
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        drawRect(
                            brush = Brush.verticalGradient(
                                listOf(
                                    Color(0xFF140C26),
                                    Color(0xFF22133D),
                                    Color(0xFF4F2445),
                                    Color(0xFFC2644B)
                                )
                            )
                        )
                        drawCircle(
                            color = Color(0xFFF59E0B).copy(alpha = 0.25f),
                            radius = size.height * 0.65f,
                            center = Offset(size.width * 0.55f, size.height * 0.95f)
                        )
                        val ridge1 = Path().apply {
                            moveTo(0f, size.height * 0.78f)
                            lineTo(size.width * 0.18f, size.height * 0.56f)
                            lineTo(size.width * 0.36f, size.height * 0.72f)
                            lineTo(size.width * 0.56f, size.height * 0.52f)
                            lineTo(size.width * 0.78f, size.height * 0.70f)
                            lineTo(size.width, size.height * 0.58f)
                            lineTo(size.width, size.height)
                            lineTo(0f, size.height)
                            close()
                        }
                        drawPath(
                            path = ridge1,
                            brush = Brush.verticalGradient(listOf(Color(0xFF2E1742), Color(0xFF140920)))
                        )
                        val ridge2 = Path().apply {
                            moveTo(0f, size.height * 0.86f)
                            lineTo(size.width * 0.24f, size.height * 0.70f)
                            lineTo(size.width * 0.45f, size.height * 0.84f)
                            lineTo(size.width * 0.72f, size.height * 0.65f)
                            lineTo(size.width, size.height * 0.82f)
                            lineTo(size.width, size.height)
                            lineTo(0f, size.height)
                            close()
                        }
                        drawPath(
                            path = ridge2,
                            brush = Brush.verticalGradient(listOf(Color(0xFF190A29), Color(0xFF090311)))
                        )
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            // Mini Watch Dial Preview
                            Box(
                                modifier = Modifier
                                    .size(58.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0A0614).copy(alpha = 0.92f))
                                    .border(2.dp, Color.White.copy(alpha = 0.25f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "WristOS",
                                        fontSize = 7.sp,
                                        color = TextSecondary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = clockStr,
                                        fontSize = 13.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Black,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = shortDateStr,
                                        fontSize = 7.sp,
                                        color = palette.secondary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = watchData.deviceName,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(3.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(statusDotColor, CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = when (watchData.connectionState) {
                                            WatchConnectionState.CONNECTED -> "Connected • ${watchData.batteryLevel}%"
                                            WatchConnectionState.SCANNING -> "Scanning BLE..."
                                            WatchConnectionState.CONNECTING -> "Linking Watch..."
                                            WatchConnectionState.DISCONNECTED -> "Disconnected"
                                        },
                                        fontSize = 12.sp,
                                        color = Color.White.copy(alpha = 0.88f),
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        FilledTonalButton(
                            onClick = {
                                if (isConnected) viewModel.disconnectWatch()
                                else viewModel.connectWatch()
                            },
                            enabled = !isScanning,
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = if (isConnected) CoralWarning.copy(alpha = 0.22f) else Color.White.copy(alpha = 0.16f),
                                contentColor = if (isConnected) CoralWarning else TextPrimary
                            ),
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = when {
                                    isScanning -> "Linking"
                                    isConnected -> "Unlink"
                                    else -> "Connect"
                                },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // 3. 6 QUICK ACTION BUTTONS GRID (matches web Dashboard!)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QuickActionTile("Ask AI", Icons.Default.AutoAwesome, palette.primary, Modifier.weight(1f)) {
                        onNavigate(Screen.Assistant.route)
                    }
                    QuickActionTile("Add Task", Icons.Default.CheckBox, Color(0xFF818CF8), Modifier.weight(1f)) {
                        modalTitle = ""; modalSub = "Today, 6:00 PM"; activeModal = "task"
                    }
                    QuickActionTile("Reminder", Icons.Default.NotificationsActive, AmberAlert, Modifier.weight(1f)) {
                        modalTitle = ""; modalSub = "In 30 minutes"; activeModal = "reminder"
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QuickActionTile("Save Memory", Icons.Default.Psychology, palette.secondary, Modifier.weight(1f)) {
                        modalTitle = ""; modalTag = "Personal"; activeModal = "memory"
                    }
                    QuickActionTile("Sync Watch", Icons.Default.Sync, EmeraldSuccess, Modifier.weight(1f)) {
                        viewModel.syncTelemetry()
                        toastMessage = if (isConnected) "Syncing telemetry..." else "Searching for watch..."
                    }
                    QuickActionTile("Buzz Watch", Icons.Default.Vibration, CoralWarning, Modifier.weight(1f)) {
                        viewModel.sendTestAlert("WristOS Ping!")
                        toastMessage = if (isConnected) "Watch buzzed!" else "Watch is disconnected"
                    }
                }
            }

            // 4. ACTIVITY ARC GAUGE & LIVE BIOMETRICS
            val steps = if (isConnected) watchData.stepCount else 0
            val stepProgress = (steps.toFloat() / dailyGoal.toFloat()).coerceIn(0f, 1f)
            val calories = (steps * 0.04f).toInt()
            val distanceKm = String.format(Locale.getDefault(), "%.1f", steps * 0.00075f)

            Surface(
                shape = RoundedCornerShape(24.dp),
                color = palette.surface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ACTIVITY & BIOMETRICS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp,
                            color = TextSecondary
                        )
                        Text(
                            text = "${(stepProgress * 100).toInt()}% of goal",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.primary
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Semicircular / Circular Arc Ring Gauge
                        Box(
                            modifier = Modifier.size(124.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Canvas(modifier = Modifier.fillMaxSize().padding(8.dp)) {
                                val strokeWidth = 12.dp.toPx()
                                drawArc(
                                    color = Color.White.copy(alpha = 0.08f),
                                    startAngle = 135f,
                                    sweepAngle = 270f,
                                    useCenter = false,
                                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                                    size = Size(size.width, size.height)
                                )
                                drawArc(
                                    brush = Brush.sweepGradient(listOf(palette.gradStart, palette.gradEnd, palette.primary)),
                                    startAngle = 135f,
                                    sweepAngle = 270f * stepProgress.coerceAtLeast(0.03f),
                                    useCenter = false,
                                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                                    size = Size(size.width, size.height)
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.DirectionsWalk,
                                    contentDescription = null,
                                    tint = palette.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (isConnected) "%,d".format(steps) else "--",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "/ %,d".format(dailyGoal),
                                    fontSize = 10.sp,
                                    color = TextTertiary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        // Right Biometrics Stack
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            BiometricMiniRow(
                                icon = Icons.Default.Favorite,
                                label = "Heart Rate",
                                value = if (isConnected && watchData.heartRate > 0) "${watchData.heartRate} BPM" else "-- BPM",
                                accent = palette.secondary
                            )
                            BiometricMiniRow(
                                icon = Icons.Default.LocalFireDepartment,
                                label = "Active Burn",
                                value = if (isConnected) "$calories kcal" else "-- kcal",
                                accent = AmberAlert
                            )
                            BiometricMiniRow(
                                icon = Icons.Default.Map,
                                label = "Distance",
                                value = if (isConnected) "$distanceKm km" else "-- km",
                                accent = EmeraldSuccess
                            )
                        }
                    }
                }
            }

            // 5. TODAY'S AGENDA PREVIEW
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = palette.surface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "AGENDA",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp,
                                color = TextSecondary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                shape = CircleShape,
                                color = palette.primary.copy(alpha = 0.16f)
                            ) {
                                Text(
                                    text = "$pendingTasksCount open",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = palette.primary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = "View All →",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.primary,
                            modifier = Modifier.clickable { onNavigate(Screen.Tasks.route) }
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (pendingList.isEmpty()) {
                        Text(
                            text = "Agenda clear! Tap 'Add Task' above or ask WristOS AI to plan your day.",
                            fontSize = 13.sp,
                            color = TextTertiary
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            pendingList.forEach { task ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(palette.surfaceElevated)
                                        .clickable { viewModel.toggleTask(task) }
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .border(1.8.dp, palette.primary, CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = task.title,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = task.dueTime,
                                        fontSize = 11.sp,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 6. AI SYSTEM DIGEST CARD
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = palette.surface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigate(Screen.Assistant.route) }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    palette.gradStart.copy(alpha = 0.14f),
                                    palette.gradEnd.copy(alpha = 0.09f),
                                    Color.Transparent
                                )
                            )
                        )
                        .padding(18.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .background(
                                        Brush.linearGradient(listOf(palette.gradStart, palette.gradEnd)),
                                        RoundedCornerShape(9.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AutoAwesome,
                                    contentDescription = null,
                                    tint = TextPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "AI System Digest",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    brush = Brush.linearGradient(listOf(palette.primary, palette.secondary))
                                ),
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isConnected) {
                                "Background BLE service active. You have $pendingTasksCount pending task(s) and $memoriesCount vault memories. Triple-click your watch button anytime—even with screen off—to talk to WristOS AI."
                            } else {
                                "Tap Connect above to pair your WristOS watch. Once linked, triple-clicking your watch button wakes AI automatically."
                            },
                            fontSize = 13.sp,
                            lineHeight = 19.sp,
                            color = TextSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
        }

        // Toast Pill
        AnimatedVisibility(
            visible = toastMessage != null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 12.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = palette.gradStart.copy(alpha = 0.95f),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
                shadowElevation = 10.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(toastMessage ?: "", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    // Quick Action Modals
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
}

@Composable
private fun QuickActionTile(
    label: String,
    icon: ImageVector,
    iconTint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val palette = LocalWristOSPalette.current
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = palette.surface,
        border = BorderStroke(1.dp, palette.border),
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(iconTint.copy(alpha = 0.14f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = label, tint = iconTint, modifier = Modifier.size(18.dp))
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
            .background(palette.surfaceElevated)
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = accent, modifier = Modifier.size(15.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = label, fontSize = 12.sp, color = TextSecondary)
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
