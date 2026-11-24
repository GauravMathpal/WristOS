package com.wristos.app.ui.settings

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.wristos.app.BuildConfig
import com.wristos.app.data.local.AppThemePreset
import com.wristos.app.data.local.SettingsPreferences
import com.wristos.app.ui.theme.*

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    val prefs = remember { SettingsPreferences.getInstance(context) }
    val palette = LocalWristOSPalette.current

    val autoSync by prefs.autoSync.collectAsState()
    val notificationsEnabled by prefs.notificationsEnabled.collectAsState()
    val vibrationAlerts by prefs.vibrationAlerts.collectAsState()
    val ttsEnabled by prefs.ttsEnabled.collectAsState()
    val autoListenOnTrigger by prefs.autoListenOnTrigger.collectAsState()
    val currentPreset by prefs.themePreset.collectAsState()
    val savedName by prefs.userName.collectAsState()
    val savedGoal by prefs.dailyStepGoal.collectAsState()
    val customKey by prefs.customGeminiApiKey.collectAsState()

    var activeTab by remember { mutableStateOf("preferences") } // preferences | appearance | background
    var nameInput by remember(savedName) { mutableStateOf(savedName) }
    var goalInput by remember(savedGoal) { mutableStateOf(savedGoal.toString()) }
    var keyInput by remember(customKey) { mutableStateOf(customKey) }
    var statusNotice by remember { mutableStateOf<String?>(null) }

    val canOverlay = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)
    val powerMgr = context.getSystemService(PowerManager::class.java)
    val ignoringBattery = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
        (powerMgr?.isIgnoringBatteryOptimizations(context.packageName) == true)
    val hasNotifPerm = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED
    val isGeminiReady = customKey.isNotBlank() || BuildConfig.GEMINI_API_KEY.isNotBlank()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(6.dp))

        // Header
        Column {
            Text(
                text = "SYSTEM CONTROL",
                style = MaterialTheme.typography.labelMedium,
                letterSpacing = 1.8.sp,
                color = palette.primary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Settings & Themes",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
        }

        // Segmented Tabs (matches Web SettingsScreen!)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(palette.surface)
                .border(1.dp, palette.border, RoundedCornerShape(16.dp))
                .padding(4.dp)
        ) {
            listOf(
                "preferences" to "Sync & AI",
                "background" to "Background",
                "appearance" to "Appearance"
            ).forEach { (id, label) ->
                val active = activeTab == id
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (active) Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd))
                            else Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                        )
                        .clickable { activeTab = id }
                        .padding(vertical = 9.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = label,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (active) TextPrimary else TextTertiary
                    )
                }
            }
        }

        if (statusNotice != null) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = EmeraldSuccess.copy(alpha = 0.14f),
                border = BorderStroke(1.dp, EmeraldSuccess.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "⚡ $statusNotice",
                    color = EmeraldSuccess,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }

        when (activeTab) {
            "preferences" -> {
                Text(
                    text = "HARDWARE & TELEMETRY",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.primary,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = palette.surface,
                    border = BorderStroke(1.dp, palette.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        SettingsSwitchRow(
                            title = "PineTime Auto-Sync",
                            subtitle = "Periodically refresh battery & step counts",
                            icon = Icons.Default.Sync,
                            checked = autoSync,
                            onCheckedChange = { prefs.setAutoSync(it) }
                        )
                        HorizontalDivider(color = palette.border)
                        SettingsSwitchRow(
                            title = "Phone-to-Watch Notifications",
                            subtitle = "Forward task reminders & alerts to Watch ANS",
                            icon = Icons.Default.NotificationsActive,
                            checked = notificationsEnabled,
                            onCheckedChange = { prefs.setNotificationsEnabled(it) }
                        )
                        HorizontalDivider(color = palette.border)
                        SettingsSwitchRow(
                            title = "Phone Haptic on Watch Trigger",
                            subtitle = "Buzz phone when watch triggers AI",
                            icon = Icons.Default.Vibration,
                            checked = vibrationAlerts,
                            onCheckedChange = { prefs.setVibrationAlerts(it) }
                        )
                        HorizontalDivider(color = palette.border)
                        SettingsSwitchRow(
                            title = "Voice Speech Auto-Reply (TTS)",
                            subtitle = "Read AI responses aloud automatically",
                            icon = Icons.Default.VolumeUp,
                            checked = ttsEnabled,
                            onCheckedChange = { prefs.setTtsEnabled(it) }
                        )
                    }
                }

                Text(
                    text = "AI ENGINE & API KEY",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.primary,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = palette.surface,
                    border = BorderStroke(1.dp, palette.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Gemini 2.0 Flash + Offline Engine", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text(
                                    text = if (isGeminiReady) "Cloud Gemini API active" else "Offline Smart NLP Engine active",
                                    fontSize = 12.sp,
                                    color = if (isGeminiReady) EmeraldSuccess else palette.primary
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = (if (isGeminiReady) EmeraldSuccess else palette.primary).copy(alpha = 0.16f)
                            ) {
                                Text(
                                    text = if (isGeminiReady) "CLOUD" else "OFFLINE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isGeminiReady) EmeraldSuccess else palette.primary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        OutlinedTextField(
                            value = keyInput,
                            onValueChange = { keyInput = it },
                            label = { Text("Optional Gemini API Key (overrides default)") },
                            visualTransformation = PasswordVisualTransformation(),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = {
                                prefs.setCustomGeminiApiKey(keyInput)
                                statusNotice = if (keyInput.isBlank()) "Cleared custom API key (Offline Smart Engine active)"
                                else "Gemini API key saved"
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Save API Key", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }

            "background" -> {
                Text(
                    text = "ALWAYS-ON WATCH AI WAKE",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.primary,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = palette.surface,
                    border = BorderStroke(1.dp, palette.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        SettingsSwitchRow(
                            title = "Auto-Listen When Watch Triggers AI",
                            subtitle = "Start mic immediately on triple-click (0xAA)",
                            icon = Icons.Default.Mic,
                            checked = autoListenOnTrigger,
                            onCheckedChange = { prefs.setAutoListenOnTrigger(it) }
                        )

                        HorizontalDivider(color = palette.border)

                        PermissionActionRow(
                            title = "Display Over Other Apps",
                            subtitle = "Allows Watch triple-click to launch AI from any screen or app",
                            granted = canOverlay,
                            onAction = {
                                val intent = Intent(
                                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                    Uri.parse("package:${context.packageName}")
                                )
                                context.startActivity(intent)
                            }
                        )

                        HorizontalDivider(color = palette.border)

                        PermissionActionRow(
                            title = "Unrestricted Background Battery",
                            subtitle = "Keeps Watch BLE connection alive when screen is off",
                            granted = ignoringBattery,
                            onAction = {
                                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                    data = Uri.parse("package:${context.packageName}")
                                }
                                try {
                                    context.startActivity(intent)
                                } catch (_: Exception) {
                                    context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                                }
                            }
                        )

                        HorizontalDivider(color = palette.border)

                        PermissionActionRow(
                            title = "Notifications & Lock-Screen Wake",
                            subtitle = "Required on Android 13+ to wake phone when screen is off",
                            granted = hasNotifPerm,
                            onAction = {
                                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                }
                                context.startActivity(intent)
                            }
                        )
                    }
                }
            }

            "appearance" -> {
                Text(
                    text = "THEME PRESETS (WEB SYNCED)",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.primary,
                    fontWeight = FontWeight.Bold
                )
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    AppThemePreset.entries.forEach { preset ->
                        val p = paletteForPreset(preset)
                        val selected = currentPreset == preset
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = palette.surface,
                            border = BorderStroke(
                                width = if (selected) 1.5.dp else 1.dp,
                                color = if (selected) p.primary else palette.border
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    prefs.setThemePreset(preset)
                                    statusNotice = "Switched theme to ${preset.displayName}"
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Row(horizontalArrangement = Arrangement.spacedBy((-6).dp)) {
                                        p.previewColors.forEach { color ->
                                            Box(
                                                modifier = Modifier
                                                    .size(22.dp)
                                                    .background(color, CircleShape)
                                                    .border(1.5.dp, palette.bgPrimary, CircleShape)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(14.dp))
                                    Column {
                                        Text(preset.displayName, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                        Text(preset.description, fontSize = 12.sp, color = TextSecondary)
                                    }
                                }
                                if (selected) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = "Active", tint = p.primary, modifier = Modifier.size(20.dp))
                                }
                            }
                        }
                    }
                }

                Text(
                    text = "PROFILE & GOALS",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.primary,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = palette.surface,
                    border = BorderStroke(1.dp, palette.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = nameInput,
                            onValueChange = { nameInput = it },
                            label = { Text("Display Name") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = goalInput,
                            onValueChange = { goalInput = it.filter { ch -> ch.isDigit() } },
                            label = { Text("Daily Step Goal") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(
                            onClick = {
                                prefs.setUserName(nameInput)
                                goalInput.toIntOrNull()?.let { prefs.setDailyStepGoal(it) }
                                statusNotice = "Profile updated"
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Save Profile", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Specs Card
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = palette.surface,
            border = BorderStroke(1.dp, palette.border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                MetaInfoRow("Ecosystem Version", "WristOS v1.16.0-PROD")
                MetaInfoRow("Hardware Target", "PineTime (Nordic nRF52832)")
                MetaInfoRow("BLE Bridge", "Foreground ConnectedDevice Service")
                MetaInfoRow("Storage Layer", "Room 2.7 (SQLite v2)")
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
private fun PermissionActionRow(
    title: String,
    subtitle: String,
    granted: Boolean,
    onAction: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = TextPrimary)
            Text(subtitle, fontSize = 12.sp, color = TextSecondary)
        }
        Spacer(modifier = Modifier.width(10.dp))
        if (granted) {
            Surface(shape = RoundedCornerShape(8.dp), color = EmeraldSuccess.copy(alpha = 0.16f)) {
                Text(
                    text = "GRANTED",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = EmeraldSuccess,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
                )
            }
        } else {
            Button(
                onClick = onAction,
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text("Grant", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
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
    val palette = LocalWristOSPalette.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .background(palette.surfaceElevated, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = palette.primary, modifier = Modifier.size(20.dp))
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
                checkedThumbColor = palette.primary,
                checkedTrackColor = palette.primary.copy(alpha = 0.3f),
                uncheckedThumbColor = TextTertiary,
                uncheckedTrackColor = palette.surfaceElevated
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
