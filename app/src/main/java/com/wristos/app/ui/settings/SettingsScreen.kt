package com.wristos.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wristos.app.BuildConfig
import com.wristos.app.ui.theme.*

@Composable
fun SettingsScreen() {
    var notificationsEnabled by remember { mutableStateOf(true) }
    var autoSyncEnabled by remember { mutableStateOf(true) }
    var vibrationAlerts by remember { mutableStateOf(true) }
    var voiceFeedback by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // Header
        Column {
            Text(
                text = "SYSTEM",
                style = MaterialTheme.typography.labelMedium,
                letterSpacing = 2.sp,
                color = CyanPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Preferences",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
        }

        // Section 1: Watch & Telemetry Sync
        Text(
            text = "HARDWARE & SYNC",
            style = MaterialTheme.typography.labelSmall,
            letterSpacing = 1.sp,
            color = TextTertiary,
            fontWeight = FontWeight.Bold
        )

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                SettingsSwitchRow(
                    title = "PineTime Auto-Sync",
                    subtitle = "Stream heart rate & step telemetry continuously",
                    icon = Icons.Default.Sync,
                    checked = autoSyncEnabled,
                    onCheckedChange = { autoSyncEnabled = it }
                )
                HorizontalDivider(color = CardBorder)
                SettingsSwitchRow(
                    title = "Phone-to-Watch Notifications",
                    subtitle = "Forward alerts to PineTime CTS & ANS",
                    icon = Icons.Default.NotificationsActive,
                    checked = notificationsEnabled,
                    onCheckedChange = { notificationsEnabled = it }
                )
                HorizontalDivider(color = CardBorder)
                SettingsSwitchRow(
                    title = "Wrist Vibration Haptics",
                    subtitle = "Trigger watch vibration on task alarms",
                    icon = Icons.Default.Vibration,
                    checked = vibrationAlerts,
                    onCheckedChange = { vibrationAlerts = it }
                )
            }
        }

        // Section 2: AI & Voice Intelligence
        Text(
            text = "AI INTELLIGENCE",
            style = MaterialTheme.typography.labelSmall,
            letterSpacing = 1.sp,
            color = TextTertiary,
            fontWeight = FontWeight.Bold
        )

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(CyanPrimary.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Psychology, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Model: Gemini 1.5 Flash", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                            Text(
                                text = if (BuildConfig.GEMINI_API_KEY.isNotBlank()) "Key loaded from local.properties"
                                else "API key missing in local.properties",
                                fontSize = 12.sp,
                                color = if (BuildConfig.GEMINI_API_KEY.isNotBlank()) EmeraldSuccess else CoralWarning
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (BuildConfig.GEMINI_API_KEY.isNotBlank()) EmeraldSuccess.copy(alpha = 0.15f)
                        else CoralWarning.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = if (BuildConfig.GEMINI_API_KEY.isNotBlank()) "ACTIVE" else "UNSET",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (BuildConfig.GEMINI_API_KEY.isNotBlank()) EmeraldSuccess else CoralWarning,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                HorizontalDivider(color = CardBorder)

                SettingsSwitchRow(
                    title = "Voice Speech Synthesis",
                    subtitle = "Read assistant responses aloud using Text-to-Speech",
                    icon = Icons.Default.VolumeUp,
                    checked = voiceFeedback,
                    onCheckedChange = { voiceFeedback = it }
                )
            }
        }

        // Section 3: Architecture & Build Metadata
        Text(
            text = "DEVICE & SPECS",
            style = MaterialTheme.typography.labelSmall,
            letterSpacing = 1.sp,
            color = TextTertiary,
            fontWeight = FontWeight.Bold
        )

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                MetaInfoRow(label = "Ecosystem Version", value = "WristOS v1.0.0-PROD")
                MetaInfoRow(label = "Hardware Target", value = "PineTime (Nordic nRF52832)")
                MetaInfoRow(label = "Firmware Protocol", value = "InfiniTime BLE CTS/HRS/ANS")
                MetaInfoRow(label = "Storage Layer", value = "Room 2.7 (SQLite)")
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun SettingsSwitchRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .background(DarkSurfaceElevated, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = TextPrimary)
            Text(subtitle, fontSize = 12.sp, color = TextSecondary)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = CyanPrimary,
                checkedTrackColor = CyanPrimary.copy(alpha = 0.3f),
                uncheckedThumbColor = TextTertiary,
                uncheckedTrackColor = DarkSurfaceElevated
            )
        )
    }
}

@Composable
fun MetaInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, fontSize = 13.sp, color = TextSecondary)
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
    }
}
