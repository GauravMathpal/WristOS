package com.wristos.app.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.BluetoothConnected
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.data.ble.WatchData

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = viewModel()) {
    val watchData by viewModel.watchData.collectAsState()
    val pendingTasks by viewModel.pendingTasksCount.collectAsState()

    val isConnected = watchData.connectionState == WatchConnectionState.CONNECTED
    val isScanning = watchData.connectionState == WatchConnectionState.SCANNING || watchData.connectionState == WatchConnectionState.CONNECTING

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "WristOS Dashboard",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        // Watch Status Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(
                                if (isConnected) Color(0xFF10B981).copy(alpha = 0.2f)
                                else MaterialTheme.colorScheme.error.copy(alpha = 0.2f),
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isConnected) Icons.Default.BluetoothConnected else Icons.Default.Bluetooth,
                            contentDescription = "Watch Connection",
                            tint = if (isConnected) Color(0xFF10B981) else MaterialTheme.colorScheme.error
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(watchData.deviceName, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                        Text(
                            text = when (watchData.connectionState) {
                                WatchConnectionState.CONNECTED -> "Connected • ${watchData.batteryLevel}% Battery"
                                WatchConnectionState.CONNECTING -> "Connecting to watch..."
                                WatchConnectionState.SCANNING -> "Scanning for PineTime..."
                                WatchConnectionState.DISCONNECTED -> "Disconnected"
                            },
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                FilledTonalButton(
                    onClick = {
                        if (isConnected) viewModel.disconnectWatch()
                        else viewModel.connectWatch()
                    },
                    enabled = !isScanning
                ) {
                    Text(
                        when {
                            isScanning -> "Pairing..."
                            isConnected -> "Disconnect"
                            else -> "Connect"
                        }
                    )
                }
            }
        }

        // Metrics Grid (Steps & Heart Rate)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "Steps",
                value = if (isConnected) "%,d".format(watchData.stepCount) else "--",
                unit = "/ 10,000",
                icon = Icons.AutoMirrored.Filled.DirectionsWalk,
                color = Color(0xFF3B82F6),
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Heart Rate",
                value = if (isConnected && watchData.heartRate > 0) watchData.heartRate.toString() else "--",
                unit = "BPM",
                icon = Icons.Default.Favorite,
                color = Color(0xFFEF4444),
                modifier = Modifier.weight(1f)
            )
        }

        // Focus Session & Alerts Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(Color(0xFF8B5CF6).copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Timer,
                            contentDescription = "Focus Timer",
                            tint = Color(0xFF8B5CF6)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Watch Alert Sync", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                        Text("Send alert & vibrate watch", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Button(
                    onClick = { viewModel.sendTestAlert() },
                    enabled = isConnected
                ) {
                    Text("Alert Watch")
                }
            }
        }

        // AI & Task Insight Box
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "WristOS Daily Summary",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (isConnected) {
                        "PineTime is synced. You have $pendingTasks pending task(s) today. Walk target progress: ${watchData.stepCount}/10,000."
                    } else {
                        "Connect your PineTime watch to view live telemetry and receive reminders directly on your wrist."
                    },
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    unit: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = title, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(verticalAlignment = Alignment.Bottom) {
                Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(4.dp))
                Text(unit, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 2.dp))
            }
        }
    }
}
