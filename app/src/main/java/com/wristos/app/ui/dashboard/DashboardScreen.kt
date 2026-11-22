package com.wristos.app.ui.dashboard

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsWalk
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.ui.theme.*

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = viewModel()) {
    val watchData by viewModel.watchData.collectAsState()
    val pendingTasks by viewModel.pendingTasksCount.collectAsState()

    val isConnected = watchData.connectionState == WatchConnectionState.CONNECTED
    val isScanning = watchData.connectionState == WatchConnectionState.SCANNING || watchData.connectionState == WatchConnectionState.CONNECTING

    val statusDotColor by animateColorAsState(
        targetValue = when (watchData.connectionState) {
            WatchConnectionState.CONNECTED -> EmeraldSuccess
            WatchConnectionState.CONNECTING, WatchConnectionState.SCANNING -> AmberAlert
            WatchConnectionState.DISCONNECTED -> CoralWarning
        },
        label = "statusDot"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // Futuristic Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "WRISTOS",
                    style = MaterialTheme.typography.labelMedium,
                    letterSpacing = 2.sp,
                    color = CyanPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Control Center",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextPrimary
                )
            }

            Surface(
                shape = RoundedCornerShape(20.dp),
                color = DarkSurfaceElevated,
                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(statusDotColor, CircleShape)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = when (watchData.connectionState) {
                            WatchConnectionState.CONNECTED -> "SYNCED"
                            WatchConnectionState.SCANNING -> "SCANNING"
                            WatchConnectionState.CONNECTING -> "LINKING"
                            WatchConnectionState.DISCONNECTED -> "STANDALONE"
                        },
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusDotColor
                    )
                }
            }
        }

        // Hardware Watch Card
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, if (isConnected) CyanPrimary.copy(alpha = 0.3f) else CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .background(
                                    brush = if (isConnected) Brush.linearGradient(listOf(CyanPrimary.copy(alpha = 0.2f), VioletSecondary.copy(alpha = 0.2f)))
                                    else Brush.linearGradient(listOf(DarkSurfaceElevated, DarkSurfaceElevated)),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .border(1.dp, if (isConnected) CyanPrimary.copy(alpha = 0.4f) else CardBorder, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isConnected) Icons.Default.Watch else Icons.Default.BluetoothDisabled,
                                contentDescription = "Watch Icon",
                                tint = if (isConnected) CyanPrimary else TextTertiary,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column {
                            Text(
                                text = watchData.deviceName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = TextPrimary
                            )
                            Text(
                                text = if (isConnected) "WatchOS BLE • ${watchData.batteryLevel}% Battery"
                                else "WatchOS Companion Unlinked",
                                fontSize = 12.sp,
                                color = TextSecondary
                            )
                        }
                    }

                    FilledTonalButton(
                        onClick = {
                            if (isConnected) viewModel.disconnectWatch()
                            else viewModel.connectWatch()
                        },
                        enabled = !isScanning,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = if (isConnected) CoralWarning.copy(alpha = 0.2f) else CyanPrimary.copy(alpha = 0.2f),
                            contentColor = if (isConnected) CoralWarning else CyanPrimary
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = when {
                                isScanning -> "Pairing..."
                                isConnected -> "Unlink"
                                else -> "Connect"
                            },
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        // Live Health & Activity Telemetry
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            TelemetryCard(
                title = "STEPS TODAY",
                value = if (isConnected) "%,d".format(watchData.stepCount) else "--",
                unit = "/ 10,000",
                icon = Icons.AutoMirrored.Filled.DirectionsWalk,
                accentColor = CyanPrimary,
                progress = if (isConnected) (watchData.stepCount / 10000f).coerceIn(0f, 1f) else 0f,
                modifier = Modifier.weight(1f)
            )

            TelemetryCard(
                title = "HEART RATE",
                value = if (isConnected && watchData.heartRate > 0) watchData.heartRate.toString() else "--",
                unit = "BPM",
                icon = Icons.Default.Favorite,
                accentColor = CoralWarning,
                progress = if (isConnected && watchData.heartRate > 0) (watchData.heartRate / 180f).coerceIn(0f, 1f) else 0f,
                modifier = Modifier.weight(1f)
            )
        }

        // Productivity & Watch Interop Actions
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "HARDWARE ACTIONS",
                    style = MaterialTheme.typography.labelSmall,
                    letterSpacing = 1.sp,
                    color = TextTertiary,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(VioletSecondary.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Vibration,
                                contentDescription = "Vibrate Alert",
                                tint = VioletSecondary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Vibrate & Alert Watch", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = TextPrimary)
                            Text("Dispatch BLE 0x1811 notification", fontSize = 12.sp, color = TextSecondary)
                        }
                    }

                    OutlinedButton(
                        onClick = { viewModel.sendTestAlert() },
                        enabled = isConnected,
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (isConnected) VioletSecondary else CardBorder),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Trigger", color = if (isConnected) VioletSecondary else TextTertiary, fontSize = 12.sp)
                    }
                }
            }
        }

        // System Intelligence Insight Card
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurfaceElevated,
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderHighlight),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = "Intelligence",
                        tint = AmberAlert,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "AI System Digest",
                        fontWeight = FontWeight.Bold,
                        color = AmberAlert,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = if (isConnected) {
                        "PineTime telemetry is streaming live. You have $pendingTasks pending task(s) on your agenda. Say 'Hey WristOS' or tap the mic on the Assistant tab to plan your next sprint."
                    } else {
                        "PineTime companion watch is unlinked. Tap 'Connect' above to enable step tracking, heart rate monitoring, and wrist vibration alerts."
                    },
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = TextPrimary
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun TelemetryCard(
    title: String,
    value: String,
    unit: String,
    icon: ImageVector,
    accentColor: Color,
    progress: Float,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = DarkSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    color = TextTertiary
                )
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .background(accentColor.copy(alpha = 0.15f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = title, tint = accentColor, modifier = Modifier.size(16.dp))
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(verticalAlignment = Alignment.Bottom) {
                Text(value, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                Spacer(modifier = Modifier.width(4.dp))
                Text(unit, fontSize = 12.sp, color = TextTertiary, modifier = Modifier.padding(bottom = 3.dp))
            }

            Spacer(modifier = Modifier.height(10.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = accentColor,
                trackColor = DarkSurfaceElevated
            )
        }
    }
}
