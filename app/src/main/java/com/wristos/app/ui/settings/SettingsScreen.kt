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
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.wristos.app.BuildConfig
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.data.local.AppThemePreset
import com.wristos.app.data.local.SettingsPreferences
import com.wristos.app.navigation.Screen
import com.wristos.app.ui.theme.*

@Composable
fun SettingsScreen(
    onNavigate: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val prefs = remember { SettingsPreferences.getInstance(context) }
    val bleManager = remember { BleManagerProvider.getInstance(context) }
    val watchData by bleManager.watchData.collectAsState()
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

    var activeTab by remember { mutableStateOf("preferences") } // preferences | background | appearance
    var nameInput by remember(savedName) { mutableStateOf(savedName) }
    var goalInput by remember(savedGoal) { mutableStateOf(savedGoal.toString()) }
    var keyInput by remember(customKey) { mutableStateOf(customKey) }
    var statusNotice by remember { mutableStateOf<String?>(null) }
    var resumeTick by remember { mutableIntStateOf(0) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                resumeTick++
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val canOverlay = remember(resumeTick) { bleManager.canDrawOverlaysCompat() }
    val canFullScreen = remember(resumeTick) { bleManager.canUseFullScreenIntentCompat() }
    val powerMgr = context.getSystemService(PowerManager::class.java)
    val ignoringBattery = remember(resumeTick) {
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            (powerMgr?.isIgnoringBatteryOptimizations(context.packageName) == true)
    }
    val hasNotifPerm = remember(resumeTick) {
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
    }
    val hasMicPerm = remember(resumeTick) {
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    }
    val isGeminiReady = customKey.isNotBlank() ||
        BuildConfig.GEMINI_API_KEY.isNotBlank() ||
        (BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Spacer(modifier = Modifier.height(6.dp))

        AuroraSectionHeader(eyebrow = "HUB & SYSTEM", title = "More & Settings")

        // Quick Module Shortcuts (Knowledge Vault & Focus Timer, matching Web Sidebar!)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AuroraGlassCard(
                modifier = Modifier.weight(1f),
                cornerRadius = 18.dp,
                onClick = { onNavigate(Screen.Memory.route) }
            ) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(34.dp).background(palette.secondary.copy(alpha = 0.16f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Psychology, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text("Knowledge Vault", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("Memories", fontSize = 10.sp, color = TextSecondary)
                    }
                }
            }

            AuroraGlassCard(
                modifier = Modifier.weight(1f),
                cornerRadius = 18.dp,
                onClick = { onNavigate(Screen.Focus.route) }
            ) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(34.dp).background(palette.primary.copy(alpha = 0.16f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Timer, contentDescription = null, tint = palette.primary, modifier = Modifier.size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text("Focus Timer", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("Pomodoro", fontSize = 10.sp, color = TextSecondary)
                    }
                }
            }
        }

        // Segmented Tabs
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
                "background" to "AI Wake",
                "appearance" to "Themes"
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
            AuroraToastPill(message = statusNotice ?: "", modifier = Modifier.fillMaxWidth())
        }

        when (activeTab) {
            "preferences" -> {
                AuroraGlassCard(
                    cornerRadius = 20.dp,
                    highlightBorder = watchData.connectionState == WatchConnectionState.CONNECTED
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "WATCH BLE BRIDGE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = palette.primary,
                                letterSpacing = 1.2.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = when (watchData.connectionState) {
                                    WatchConnectionState.CONNECTED -> "${watchData.deviceName} • ${watchData.batteryLevel}%"
                                    WatchConnectionState.SCANNING -> watchData.statusMessage ?: "Scanning for WristOS..."
                                    WatchConnectionState.CONNECTING -> "Linking to watch..."
                                    WatchConnectionState.DISCONNECTED -> watchData.statusMessage ?: "Watch disconnected"
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (watchData.connectionState == WatchConnectionState.CONNECTED) {
                                EmeraldSuccess.copy(alpha = 0.16f)
                            } else {
                                palette.primary.copy(alpha = 0.18f)
                            },
                            border = BorderStroke(
                                1.dp,
                                if (watchData.connectionState == WatchConnectionState.CONNECTED) EmeraldSuccess else palette.primary
                            ),
                            modifier = Modifier.clickable {
                                bleManager.startScan(forceActiveScan = true)
                                statusNotice = "Scanning for WristOS watch..."
                            }
                        ) {
                            Text(
                                text = if (watchData.connectionState == WatchConnectionState.CONNECTED) "Resync" else "Reconnect",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (watchData.connectionState == WatchConnectionState.CONNECTED) EmeraldSuccess else palette.primaryVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }

                AuroraGlassCard(cornerRadius = 20.dp) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("HARDWARE & TELEMETRY", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.primary, letterSpacing = 1.2.sp)
                        SettingsSwitchRow("PineTime Auto-Sync", "Periodically refresh battery & step counts", Icons.Default.Sync, autoSync) {
                            prefs.setAutoSync(it)
                        }
                        HorizontalDivider(color = palette.border)
                        SettingsSwitchRow("Phone-to-Watch Notifications", "Forward task reminders & alerts to Watch ANS", Icons.Default.NotificationsActive, notificationsEnabled) {
                            prefs.setNotificationsEnabled(it)
                        }
                        HorizontalDivider(color = palette.border)
                        SettingsSwitchRow("Phone Haptic on Watch Trigger", "Buzz phone when watch triggers AI", Icons.Default.Vibration, vibrationAlerts) {
                            prefs.setVibrationAlerts(it)
                        }
                        HorizontalDivider(color = palette.border)
                        SettingsSwitchRow("Voice Speech Auto-Reply (TTS)", "Read AI responses aloud automatically", Icons.Default.VolumeUp, ttsEnabled) {
                            prefs.setTtsEnabled(it)
                        }
                    }
                }

                AuroraGlassCard(cornerRadius = 20.dp) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Gemini 3.8 Flash + Offline Engine", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text(
                                    text = if (isGeminiReady) {
                                        if (customKey.isNotBlank()) "Personal Gemini API Key active" else "WristOS Cloud Gemini active"
                                    } else {
                                        "Offline Smart NLP Engine active"
                                    },
                                    fontSize = 12.sp,
                                    color = if (isGeminiReady) EmeraldSuccess else palette.primary
                                )
                            }
                            AuroraPillBadge(
                                text = if (isGeminiReady) "CLOUD" else "OFFLINE",
                                color = if (isGeminiReady) EmeraldSuccess else palette.primary
                            )
                        }

                        OutlinedTextField(
                            value = keyInput,
                            onValueChange = { keyInput = it },
                            label = { Text("Optional Gemini API Key") },
                            visualTransformation = PasswordVisualTransformation(),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        AuroraGradientButton(
                            text = "Save API Key",
                            onClick = {
                                prefs.setCustomGeminiApiKey(keyInput)
                                statusNotice = if (keyInput.isBlank()) "Cleared API key (Offline Engine active)" else "Gemini API key saved"
                            }
                        )
                    }
                }
            }

            "background" -> {
                AuroraGlassCard(cornerRadius = 20.dp, highlightBorder = !canFullScreen || !canOverlay) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Text("ALWAYS-ON WATCH AI WAKE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.primary, letterSpacing = 1.2.sp)

                        SettingsSwitchRow(
                            title = "Auto-Listen When Watch Triggers AI",
                            subtitle = "Start mic immediately on AI bubble or triple-click (0xAA)",
                            icon = Icons.Default.Mic,
                            checked = autoListenOnTrigger,
                            onCheckedChange = { prefs.setAutoListenOnTrigger(it) }
                        )

                        HorizontalDivider(color = palette.border)

                        PermissionActionRow(
                            title = "Microphone Access",
                            subtitle = "Required to transcribe voice commands",
                            granted = hasMicPerm,
                            onAction = {
                                context.startActivity(
                                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
                                )
                            }
                        )

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                            HorizontalDivider(color = palette.border)
                            PermissionActionRow(
                                title = "Lockscreen Full-Screen Wake",
                                subtitle = "Required on Android 14+ so Watch wakes AI over lockscreen",
                                granted = canFullScreen,
                                onAction = {
                                    context.startActivity(
                                        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
                                    )
                                }
                            )
                        }

                        HorizontalDivider(color = palette.border)

                        PermissionActionRow(
                            title = "Display Over Other Apps",
                            subtitle = "Required so Watch opens AI immediately even over other apps",
                            granted = canOverlay,
                            onAction = {
                                context.startActivity(
                                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
                                )
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
                            title = "Notifications & Lockscreen",
                            subtitle = "Required on Android 13+ for AI wake trigger notifications",
                            granted = hasNotifPerm,
                            onAction = {
                                context.startActivity(
                                    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                    }
                                )
                            }
                        )
                    }
                }
            }

            "appearance" -> {
                Text("THEME PRESETS (WEB SYNCED)", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.primary, letterSpacing = 1.2.sp)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    AppThemePreset.entries.forEach { preset ->
                        val p = paletteForPreset(preset)
                        val selected = currentPreset == preset
                        AuroraGlassCard(
                            cornerRadius = 18.dp,
                            highlightBorder = selected,
                            accentGlow = p.primary,
                            onClick = {
                                prefs.setThemePreset(preset)
                                statusNotice = "Switched theme to ${preset.displayName}"
                            }
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(14.dp),
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

                AuroraGlassCard(cornerRadius = 20.dp) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("PROFILE & GOALS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.primary, letterSpacing = 1.2.sp)
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
                        AuroraGradientButton(
                            text = "Save Profile",
                            onClick = {
                                prefs.setUserName(nameInput)
                                goalInput.toIntOrNull()?.let { prefs.setDailyStepGoal(it) }
                                statusNotice = "Profile updated"
                            }
                        )
                    }
                }
            }
        }

        AuroraGlassCard(cornerRadius = 20.dp) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                MetaInfoRow("Ecosystem Version", "WristOS v1.16.0-PROD")
                MetaInfoRow("Hardware Target", "PineTime (Nordic nRF52832)")
                MetaInfoRow("BLE Bridge", "Foreground ConnectedDevice Service")
                MetaInfoRow("Storage Layer", "Room 2.7 (SQLite v4)")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun PermissionActionRow(
    title: String,
    subtitle: String,
    granted: Boolean,
    onAction: () -> Unit
) {
    val palette = LocalWristOSPalette.current
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
            AuroraPillBadge(text = "GRANTED", color = EmeraldSuccess)
        } else {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = palette.primary.copy(alpha = 0.2f),
                border = BorderStroke(1.dp, palette.primary),
                modifier = Modifier.clickable(onClick = onAction)
            ) {
                Text(
                    text = "Grant",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = palette.primaryVariant,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
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
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(38.dp).background(palette.surfaceElevated, RoundedCornerShape(10.dp)),
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
