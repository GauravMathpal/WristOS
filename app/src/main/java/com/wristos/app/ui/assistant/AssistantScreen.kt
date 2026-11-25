package com.wristos.app.ui.assistant

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.ui.theme.*
import kotlin.math.sin

@Composable
fun AssistantScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: AssistantViewModel = viewModel()
) {
    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isListening by viewModel.voiceManager.isListening.collectAsState()
    val speechText by viewModel.voiceManager.speechText.collectAsState()
    val voiceError by viewModel.voiceManager.errorMessage.collectAsState()
    val rmsDb by viewModel.voiceManager.rmsDb.collectAsState()
    val ttsEnabled by viewModel.voiceManager.ttsEnabled.collectAsState()
    val remoteTriggerNotice by viewModel.remoteTriggerNotice.collectAsState()
    val lastSubmittedPrompt by viewModel.lastSubmittedPrompt.collectAsState()
    val lastAssistantReply by viewModel.lastAssistantReply.collectAsState()
    val pendingAiTrigger by viewModel.bleManager.pendingAiTrigger.collectAsState()

    val palette = LocalWristOSPalette.current
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var viewMode by remember { mutableStateOf("orb") } // "orb" | "chat"
    var inputText by remember { mutableStateOf("") }
    var isResumed by remember {
        mutableStateOf(lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED))
    }
    val listState = rememberLazyListState()

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.startVoiceInput()
        }
    }

    val systemSpeechLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spoken = result.data
                ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                ?.firstOrNull()
                ?.trim()
            if (!spoken.isNullOrBlank()) {
                viewModel.voiceManager.clearError()
                viewModel.sendMessage(spoken)
                viewMode = "chat"
            }
        }
    }

    DisposableEffect(viewModel) {
        viewModel.voiceManager.setSystemSpeechFallback {
            val speechIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PROMPT, "WristOS AI • Speak now...")
            }
            try {
                systemSpeechLauncher.launch(speechIntent)
            } catch (_: Exception) {
            }
        }
        onDispose {
            viewModel.voiceManager.setSystemSpeechFallback(null)
        }
    }

    fun requestMicAndListen() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            viewModel.startVoiceInput()
        } else {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> isResumed = true
                Lifecycle.Event.ON_PAUSE -> isResumed = false
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // ONLY consume watch trigger when Activity is truly RESUMED in foreground so mic is never blocked in background!
    LaunchedEffect(pendingAiTrigger, isResumed) {
        if (pendingAiTrigger != 0L && isResumed) {
            viewMode = "orb"
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                viewModel.handleWatchTriggerIfPending()
            } else if (viewModel.bleManager.consumePendingAiTrigger()) {
                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }

    LaunchedEffect(messages.size, viewMode) {
        if (viewMode == "chat" && messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // 1. WEB-STYLE AURORA HEADER
        AuroraGlassCard(cornerRadius = 22.dp) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(palette.surfaceElevated)
                                .border(1.dp, palette.border, RoundedCornerShape(12.dp))
                                .clickable { onNavigateBack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Back", tint = TextSecondary, modifier = Modifier.size(20.dp))
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("WristOS AI", fontSize = 16.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                                Spacer(modifier = Modifier.width(8.dp))
                                val badgeColor = when {
                                    isListening -> PinkAccent
                                    isLoading -> AmberAlert
                                    else -> EmeraldSuccess
                                }
                                AuroraPillBadge(
                                    text = when {
                                        isListening -> "LISTENING"
                                        isLoading -> "THINKING"
                                        else -> "LIVE"
                                    },
                                    color = badgeColor
                                )
                            }
                            Text(
                                text = if (viewModel.isGeminiConfigured) "Gemini Flash • Watch Neural Bridge" else "Smart Engine • Zero Latency",
                                fontSize = 11.sp,
                                color = palette.primaryVariant.copy(alpha = 0.85f)
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        IconButton(
                            onClick = { viewModel.voiceManager.setTtsEnabled(!ttsEnabled) },
                            modifier = Modifier
                                .size(34.dp)
                                .background(palette.surfaceElevated, RoundedCornerShape(10.dp))
                                .border(
                                    1.dp,
                                    if (ttsEnabled) palette.secondary.copy(alpha = 0.5f) else palette.border,
                                    RoundedCornerShape(10.dp)
                                )
                        ) {
                            Icon(
                                imageVector = if (ttsEnabled) Icons.AutoMirrored.Filled.VolumeUp else Icons.AutoMirrored.Filled.VolumeOff,
                                contentDescription = "Toggle Voice",
                                tint = if (ttsEnabled) palette.secondary else TextTertiary,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = palette.surfaceElevated,
                            border = BorderStroke(1.dp, palette.border),
                            modifier = Modifier.clickable { viewModel.clearChat() }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.DeleteOutline, contentDescription = "Clear", tint = CoralWarning, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Clear", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
                            }
                        }
                    }
                }

                // Segmented Voice Orb / Chat Switcher
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(palette.bgPrimary.copy(alpha = 0.75f))
                        .border(1.dp, palette.border, RoundedCornerShape(14.dp))
                        .padding(4.dp)
                ) {
                    listOf("orb" to "Voice Orb", "chat" to "Chat (${messages.size})").forEach { (id, label) ->
                        val active = viewMode == id
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (active) Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd))
                                    else Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                                )
                                .clickable { viewMode = id }
                                .padding(vertical = 8.dp),
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
            }
        }

        // 2. REMOTE WATCH TRIGGER BANNER
        AnimatedVisibility(visible = remoteTriggerNotice != null, enter = fadeIn(), exit = fadeOut()) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = EmeraldSuccess.copy(alpha = 0.14f),
                border = BorderStroke(1.dp, EmeraldSuccess.copy(alpha = 0.45f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.BluetoothConnected, contentDescription = null, tint = EmeraldSuccess, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(remoteTriggerNotice ?: "", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                    AuroraPillBadge(text = "0xAA OK", color = EmeraldSuccess)
                }
            }
        }

        // 3. VOICE ERROR BANNER
        AnimatedVisibility(visible = voiceError != null, enter = fadeIn(), exit = fadeOut()) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = CoralWarning.copy(alpha = 0.12f),
                border = BorderStroke(1.dp, CoralWarning.copy(alpha = 0.45f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = CoralWarning, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(voiceError ?: "", fontSize = 12.sp, color = CoralWarning, modifier = Modifier.weight(1f))
                    TextButton(onClick = {
                        viewModel.voiceManager.clearError()
                        requestMicAndListen()
                    }) {
                        Text("Retry", color = palette.primary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        // 4. MAIN BODY
        if (viewMode == "orb") {
            AuroraGlassCard(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                highlightBorder = isListening,
                accentGlow = if (isListening) PinkAccent else palette.gradStart
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(18.dp)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Spacer(modifier = Modifier.height(2.dp))

                    BreathingVoiceOrb(
                        isListening = isListening,
                        isLoading = isLoading,
                        rmsDb = rmsDb,
                        onClick = {
                            if (isListening) {
                                val captured = speechText.trim()
                                viewModel.voiceManager.stopListening(markDelivered = true)
                                if (captured.isNotBlank()) viewModel.sendMessage(captured)
                            } else {
                                requestMicAndListen()
                            }
                        }
                    )

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = when {
                                isListening -> "Listening on Phone..."
                                isLoading -> "Thinking..."
                                else -> "How can I help you?"
                            },
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isListening) "Speak naturally — pause submits automatically" else "Tap the Orb or Watch AI bubble to speak",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center
                        )
                    }

                    AudioEqualizerBars(isListening = isListening, isLoading = isLoading, rmsDb = rmsDb)

                    if (isListening) {
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = palette.bgPrimary.copy(alpha = 0.78f),
                            border = BorderStroke(1.dp, PinkAccent.copy(alpha = 0.55f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("LIVE VOICE CAPTURE", fontSize = 10.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = PinkAccent)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = if (speechText.isNotBlank()) "\"$speechText\"" else "Listening... Speak your task or question",
                                    fontSize = 14.sp,
                                    color = TextPrimary
                                )
                                if (speechText.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    AuroraGradientButton(
                                        text = "Send Now",
                                        onClick = {
                                            val text = speechText.trim()
                                            viewModel.voiceManager.stopListening(markDelivered = true)
                                            viewModel.sendMessage(text)
                                        }
                                    )
                                }
                            }
                        }
                    } else if (lastAssistantReply != null) {
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = palette.bgPrimary.copy(alpha = 0.72f),
                            border = BorderStroke(1.dp, palette.border),
                            modifier = Modifier.fillMaxWidth().clickable { viewMode = "chat" }
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (lastSubmittedPrompt.isNotBlank()) "YOU: $lastSubmittedPrompt" else "AI RESPONSE",
                                        fontSize = 10.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold,
                                        color = EmeraldSuccess,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Text("Chat →", fontSize = 11.sp, color = palette.primary, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = lastAssistantReply ?: "",
                                    fontSize = 13.sp,
                                    color = TextPrimary,
                                    maxLines = 3,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Compact Controls Row
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.triggerWatchWakeTest() },
                            border = BorderStroke(1.dp, palette.primary.copy(alpha = 0.45f)),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Icon(Icons.Default.Watch, contentDescription = null, tint = palette.primary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Wake Test", fontSize = 12.sp, color = palette.primary, fontWeight = FontWeight.Bold)
                        }

                        AuroraGradientButton(
                            text = if (isListening) "Stop Mic" else "Speak Now",
                            onClick = {
                                if (isListening) {
                                    val captured = speechText.trim()
                                    viewModel.voiceManager.stopListening(markDelivered = true)
                                    if (captured.isNotBlank()) viewModel.sendMessage(captured)
                                } else {
                                    requestMicAndListen()
                                }
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = if (isListening) Icons.Default.Stop else Icons.Default.Mic,
                                    contentDescription = null,
                                    tint = TextPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        )
                    }

                    // Quick Prompt Chips
                    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            QuickCommandChip("Plan My Day", Modifier.weight(1f)) {
                                viewModel.sendMessage("Plan my day and review pending tasks")
                                viewMode = "chat"
                            }
                            QuickCommandChip("Add 5 PM Task", Modifier.weight(1f)) {
                                viewModel.sendMessage("I have to complete firmware tests by tmr 5pm")
                                viewMode = "chat"
                            }
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            QuickCommandChip("Ping Watch", Modifier.weight(1f)) {
                                viewModel.sendMessage("Send haptic alert to watch")
                                viewMode = "chat"
                            }
                            QuickCommandChip("Save Goal", Modifier.weight(1f)) {
                                viewModel.sendMessage("Remember that my health goal is 10000 daily steps")
                                viewMode = "chat"
                            }
                        }
                    }
                }
            }
        } else {
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(messages, key = { it.id }) { msg ->
                    ChatBubble(message = msg)
                }
                if (isLoading) {
                    item { LoadingBubble() }
                }
            }
        }

        // 5. BOTTOM PROMPT INPUT BAR
        AuroraGlassCard(cornerRadius = 22.dp) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        if (isListening) {
                            val captured = speechText.trim()
                            viewModel.voiceManager.stopListening(markDelivered = true)
                            if (captured.isNotBlank()) viewModel.sendMessage(captured)
                        } else {
                            requestMicAndListen()
                        }
                    },
                    modifier = Modifier
                        .size(40.dp)
                        .background(if (isListening) PinkAccent else palette.surfaceElevated, CircleShape)
                ) {
                    Icon(
                        imageVector = if (isListening) Icons.Default.Stop else Icons.Default.Mic,
                        contentDescription = "Voice",
                        tint = if (isListening) TextPrimary else palette.primary,
                        modifier = Modifier.size(19.dp)
                    )
                }

                Spacer(modifier = Modifier.width(6.dp))

                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Ask AI, add task, remember fact...", color = TextTertiary, fontSize = 13.sp) },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            if (inputText.isNotBlank() && !isLoading) {
                                viewModel.sendMessage(inputText)
                                inputText = ""
                                viewMode = "chat"
                            }
                        }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = palette.primary
                    ),
                    modifier = Modifier.weight(1f),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.width(6.dp))

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank() && !isLoading) {
                            viewModel.sendMessage(inputText)
                            inputText = ""
                            viewMode = "chat"
                        }
                    },
                    enabled = inputText.isNotBlank() && !isLoading,
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            brush = if (inputText.isNotBlank() && !isLoading) {
                                Brush.linearGradient(listOf(palette.gradStart, palette.gradEnd))
                            } else {
                                Brush.linearGradient(listOf(palette.surfaceElevated, palette.surfaceElevated))
                            },
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = if (inputText.isNotBlank() && !isLoading) TextPrimary else TextTertiary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BreathingVoiceOrb(
    isListening: Boolean,
    isLoading: Boolean,
    rmsDb: Float,
    onClick: () -> Unit
) {
    val palette = LocalWristOSPalette.current
    val infiniteTransition = rememberInfiniteTransition(label = "orb")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.94f,
        targetValue = if (isListening) 1.12f else 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isListening) 650 else 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "orbPulse"
    )
    val audioBoost = if (isListening) (rmsDb / 40f).coerceIn(0f, 0.18f) else 0f

    Box(
        modifier = Modifier
            .size(172.dp)
            .scale(pulse + audioBoost)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val c1 = if (isListening) PinkAccent else palette.gradStart
            val c2 = if (isLoading) AmberAlert else palette.gradEnd
            drawCircle(
                brush = Brush.radialGradient(listOf(c1.copy(alpha = 0.36f), Color.Transparent)),
                radius = size.minDimension * 0.5f
            )
            drawCircle(
                color = c1.copy(alpha = 0.32f),
                radius = size.minDimension * 0.43f,
                style = Stroke(width = 2.dp.toPx())
            )
            drawCircle(
                color = c2.copy(alpha = 0.25f),
                radius = size.minDimension * 0.39f,
                style = Stroke(width = 1.dp.toPx())
            )
            drawCircle(
                brush = Brush.linearGradient(listOf(c1, c2)),
                radius = size.minDimension * 0.33f
            )
            drawCircle(
                color = Color.White.copy(alpha = 0.24f),
                radius = size.minDimension * 0.22f,
                center = Offset(size.width * 0.44f, size.height * 0.42f)
            )
        }
        Icon(
            imageVector = if (isListening) Icons.Default.GraphicEq else if (isLoading) Icons.Default.AutoAwesome else Icons.Default.Mic,
            contentDescription = "Voice Orb",
            tint = TextPrimary,
            modifier = Modifier.size(38.dp)
        )
    }
}

@Composable
private fun AudioEqualizerBars(isListening: Boolean, isLoading: Boolean, rmsDb: Float) {
    val palette = LocalWristOSPalette.current
    val infiniteTransition = rememberInfiniteTransition(label = "eq")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.283f,
        animationSpec = infiniteRepeatable(tween(1100, easing = LinearEasing)),
        label = "eqPhase"
    )

    Row(
        modifier = Modifier.height(28.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        for (i in 0 until 12) {
            val fraction = if (isListening || isLoading) {
                val base = ((sin(phase + i * 0.65f) + 1f) * 0.5f).coerceIn(0.25f, 1f)
                val rmsFactor = if (isListening) (0.4f + (rmsDb / 14f)).coerceIn(0.4f, 1f) else 0.7f
                (base * rmsFactor).coerceIn(0.2f, 1f)
            } else {
                0.22f
            }
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height((26f * fraction).dp)
                    .clip(CircleShape)
                    .background(
                        if (isListening) PinkAccent
                        else if (isLoading) AmberAlert
                        else palette.primary.copy(alpha = 0.35f)
                    )
            )
        }
    }
}

@Composable
private fun QuickCommandChip(
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val palette = LocalWristOSPalette.current
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = palette.bgPrimary.copy(alpha = 0.65f),
        border = BorderStroke(1.dp, palette.border),
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = "⚡ $label",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = TextSecondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
        )
    }
}

@Composable
fun ChatBubble(message: AssistantMessage) {
    val palette = LocalWristOSPalette.current
    val bubbleShape = RoundedCornerShape(
        topStart = 18.dp,
        topEnd = 18.dp,
        bottomStart = if (message.isUser) 18.dp else 4.dp,
        bottomEnd = if (message.isUser) 4.dp else 18.dp
    )

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = if (message.isUser) Alignment.CenterEnd else Alignment.CenterStart
    ) {
        Column(
            modifier = Modifier.widthIn(max = 300.dp),
            horizontalAlignment = if (message.isUser) Alignment.End else Alignment.Start
        ) {
            Box(
                modifier = if (message.isUser) {
                    Modifier
                        .clip(bubbleShape)
                        .background(Brush.linearGradient(listOf(palette.gradStart, palette.gradEnd)), bubbleShape)
                } else {
                    Modifier
                        .clip(bubbleShape)
                        .background(palette.surfaceElevated, bubbleShape)
                        .border(1.dp, palette.border, bubbleShape)
                }
            ) {
                Text(
                    text = message.content,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    color = TextPrimary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }

            if (message.actionNotification != null) {
                Spacer(modifier = Modifier.height(4.dp))
                AuroraPillBadge(text = "⚡ ${message.actionNotification}", color = EmeraldSuccess)
            }
        }
    }
}

@Composable
fun LoadingBubble() {
    val palette = LocalWristOSPalette.current
    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = palette.surfaceElevated,
            border = BorderStroke(1.dp, palette.border)
        ) {
            Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = palette.primary)
                Spacer(modifier = Modifier.width(10.dp))
                Text(text = "Thinking...", color = TextSecondary, fontSize = 13.sp)
            }
        }
    }
}
