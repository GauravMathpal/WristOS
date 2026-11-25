package com.wristos.app.core.voice

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.core.content.ContextCompat
import com.wristos.app.data.local.SettingsPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

class VoiceManager(context: Context) {
    private val appContext = context.applicationContext
    private val prefs = SettingsPreferences.getInstance(appContext)

    // Text to Speech
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    // Speech to Text
    private var speechRecognizer: SpeechRecognizer? = null
    private var isUsingOnDeviceRecognizer = false
    private var silenceRunnable: Runnable? = null
    private var startDelayRunnable: Runnable? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    private var audioFocusRequest: AudioFocusRequest? = null
    private var hasDeliveredResult = false
    private var retryCount = 0
    private var preferOfflineNextAttempt = false
    private var fallbackLauncherCallback: (() -> Unit)? = null

    fun setSystemSpeechFallback(callback: (() -> Unit)?) {
        fallbackLauncherCallback = callback
    }

    private val _isListening = MutableStateFlow(false)
    val isListening: StateFlow<Boolean> = _isListening.asStateFlow()

    private val _speechText = MutableStateFlow("")
    val speechText: StateFlow<String> = _speechText.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _rmsDb = MutableStateFlow(0f)
    val rmsDb: StateFlow<Float> = _rmsDb.asStateFlow()

    val ttsEnabled: StateFlow<Boolean> = prefs.ttsEnabled

    init {
        initTts()
    }

    private fun initTts() {
        textToSpeech = TextToSpeech(appContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech?.language = Locale.getDefault()
                isTtsReady = true
            }
        }
    }

    fun playWakeChime() {
        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 75)
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 160)
            mainHandler.postDelayed({
                try {
                    toneGen.release()
                } catch (_: Exception) {
                }
            }, 250L)
        } catch (_: Exception) {
        }
    }

    fun speak(text: String) {
        if (isTtsReady && ttsEnabled.value && text.isNotBlank()) {
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "WristOSTTS_${System.currentTimeMillis()}")
        }
    }

    fun stopSpeaking() {
        textToSpeech?.stop()
    }

    fun setTtsEnabled(enabled: Boolean) {
        prefs.setTtsEnabled(enabled)
        if (!enabled) stopSpeaking()
    }

    private fun cleanupRecognizer() {
        try {
            speechRecognizer?.cancel()
            speechRecognizer?.destroy()
        } catch (_: Exception) {
        }
        speechRecognizer = null
    }

    private fun cancelSilenceTimer() {
        silenceRunnable?.let { mainHandler.removeCallbacks(it) }
        silenceRunnable = null
    }

    private fun resetSilenceTimer(delayMs: Long, onTimeout: () -> Unit) {
        cancelSilenceTimer()
        val runnable = Runnable { onTimeout() }
        silenceRunnable = runnable
        mainHandler.postDelayed(runnable, delayMs)
    }

    private fun requestVoiceAudioFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ASSISTANT)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                    )
                    .build()
                audioFocusRequest = req
                audioManager?.requestAudioFocus(req)
            } else {
                @Suppress("DEPRECATION")
                audioManager?.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
            }
        } catch (_: Exception) {
        }
    }

    private fun abandonVoiceAudioFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
                audioFocusRequest = null
            } else {
                @Suppress("DEPRECATION")
                audioManager?.abandonAudioFocus(null)
            }
        } catch (_: Exception) {
        }
    }

    fun startListening(onResult: (String) -> Unit) {
        retryCount = 0
        preferOfflineNextAttempt = false
        isUsingOnDeviceRecognizer = false
        startListeningInternal(onResult)
    }

    private fun startListeningInternal(onResult: (String) -> Unit) {
        startDelayRunnable?.let { mainHandler.removeCallbacks(it) }
        val r = Runnable { beginRecognizerSession(onResult) }
        startDelayRunnable = r
        mainHandler.post(r)
    }

    private fun createBestSpeechRecognizer(): SpeechRecognizer {
        if (preferOfflineNextAttempt &&
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            SpeechRecognizer.isOnDeviceRecognitionAvailable(appContext)
        ) {
            isUsingOnDeviceRecognizer = true
            return SpeechRecognizer.createOnDeviceSpeechRecognizer(appContext)
        }
        isUsingOnDeviceRecognizer = false
        return SpeechRecognizer.createSpeechRecognizer(appContext)
    }

    private fun beginRecognizerSession(onResult: (String) -> Unit) {
        try {
            if (ContextCompat.checkSelfPermission(
                    appContext,
                    android.Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                _errorMessage.value = "Microphone permission required. Please allow audio access."
                _isListening.value = false
                return
            }

            val hasStandard = SpeechRecognizer.isRecognitionAvailable(appContext)
            val hasOnDevice = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                SpeechRecognizer.isOnDeviceRecognitionAvailable(appContext)

            if (!hasStandard && !hasOnDevice) {
                Log.w("VoiceManager", "Speech recognition service not available on device")
                _errorMessage.value = "Speech recognition service unavailable — tap System Mic or type."
                _isListening.value = false
                return
            }

            // If we need to recreate the recognizer cleanly, destroy first and wait 160ms so Google's ServiceConnection unbinds cleanly
            if (speechRecognizer != null) {
                cleanupRecognizer()
                val delayed = Runnable { launchRecognizerNow(onResult) }
                startDelayRunnable = delayed
                mainHandler.postDelayed(delayed, 160L)
                return
            }

            launchRecognizerNow(onResult)
        } catch (e: Exception) {
            cancelSilenceTimer()
            Log.e("VoiceManager", "Failed to prepare speech recognition", e)
            _errorMessage.value = "Voice input error: ${e.localizedMessage ?: "Unknown"}"
            _isListening.value = false
        }
    }

    private fun launchRecognizerNow(onResult: (String) -> Unit) {
        try {
            _errorMessage.value = null
            _speechText.value = ""
            _rmsDb.value = 0f
            hasDeliveredResult = false
            stopSpeaking()
            cancelSilenceTimer()
            requestVoiceAudioFocus()

            val recognizer = createBestSpeechRecognizer()
            speechRecognizer = recognizer

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, appContext.packageName)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toLanguageTag())
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                if (preferOfflineNextAttempt) {
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                }
            }

            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    _isListening.value = true
                    _errorMessage.value = null
                    // Initial silence timeout: 6 seconds before closing mic
                    resetSilenceTimer(6000L) {
                        Log.d("VoiceManager", "Auto-stopping voice input due to initial silence")
                        stopListening()
                    }
                }

                override fun onBeginningOfSpeech() {
                    cancelSilenceTimer()
                }

                override fun onRmsChanged(rmsdB: Float) {
                    _rmsDb.value = rmsdB.coerceIn(0f, 12f)
                }

                override fun onBufferReceived(buffer: ByteArray?) {}

                override fun onEndOfSpeech() {
                    cancelSilenceTimer()
                    abandonVoiceAudioFocus()
                    _isListening.value = false
                    _rmsDb.value = 0f
                }

                override fun onError(error: Int) {
                    cancelSilenceTimer()
                    abandonVoiceAudioFocus()
                    _rmsDb.value = 0f
                    Log.w("VoiceManager", "SpeechRecognizer error: $error (retry=$retryCount, onDevice=$isUsingOnDeviceRecognizer)")

                    // Error 11 = ERROR_SERVER_DISCONNECTED: unbind dead recognizer, try on-device/clean rebind once, otherwise open system mic sheet
                    if (error == SpeechRecognizer.ERROR_SERVER_DISCONNECTED) {
                        cleanupRecognizer()
                        val canUseOnDevice = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                            SpeechRecognizer.isOnDeviceRecognitionAvailable(appContext) &&
                            !isUsingOnDeviceRecognizer
                        if (retryCount == 0) {
                            retryCount++
                            if (canUseOnDevice) {
                                preferOfflineNextAttempt = true
                            }
                            _isListening.value = false
                            val delayed = Runnable { launchRecognizerNow(onResult) }
                            startDelayRunnable = delayed
                            mainHandler.postDelayed(delayed, 200L)
                            return
                        }
                        if (fallbackLauncherCallback != null) {
                            _isListening.value = false
                            _errorMessage.value = null
                            fallbackLauncherCallback?.invoke()
                            return
                        }
                    }

                    // Transient wake errors (busy / audio HAL settling / client / network)
                    val isTransient = error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ||
                        error == SpeechRecognizer.ERROR_AUDIO ||
                        error == SpeechRecognizer.ERROR_CLIENT ||
                        error == SpeechRecognizer.ERROR_NETWORK

                    if (isTransient && retryCount < 2) {
                        cleanupRecognizer()
                        retryCount++
                        if (error == SpeechRecognizer.ERROR_NETWORK) {
                            preferOfflineNextAttempt = true
                        }
                        _isListening.value = false
                        val delayed = Runnable { launchRecognizerNow(onResult) }
                        startDelayRunnable = delayed
                        mainHandler.postDelayed(delayed, 260L)
                        return
                    }

                    // If partial text was already captured before NO_MATCH/TIMEOUT, deliver it once
                    if (!hasDeliveredResult && _speechText.value.isNotBlank() &&
                        (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)
                    ) {
                        hasDeliveredResult = true
                        _isListening.value = false
                        onResult(_speechText.value.trim())
                        return
                    }

                    val errorDesc = when (error) {
                        SpeechRecognizer.ERROR_AUDIO -> "Microphone busy — tap Speak or Retry"
                        SpeechRecognizer.ERROR_CLIENT -> "Speech service reset — tap Speak to retry"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission not granted"
                        SpeechRecognizer.ERROR_NETWORK -> "Network speech unavailable — tap Retry"
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Speech network timeout"
                        SpeechRecognizer.ERROR_NO_MATCH -> "Didn't catch that. Tap the Orb to try again."
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer busy — tap to retry"
                        SpeechRecognizer.ERROR_SERVER -> "Google Speech server error"
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected. Tap the Orb to speak."
                        SpeechRecognizer.ERROR_SERVER_DISCONNECTED -> "Voice service disconnected — tap Retry for system mic"
                        else -> "Voice input interrupted (code $error) — tap Retry"
                    }
                    _errorMessage.value = errorDesc
                    _isListening.value = false
                }

                override fun onResults(results: Bundle?) {
                    cancelSilenceTimer()
                    abandonVoiceAudioFocus()
                    _isListening.value = false
                    _rmsDb.value = 0f
                    if (hasDeliveredResult) return

                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val recognized = matches?.firstOrNull()?.trim().orEmpty()
                        .ifBlank { _speechText.value.trim() }

                    if (recognized.isNotBlank()) {
                        hasDeliveredResult = true
                        _speechText.value = recognized
                        onResult(recognized)
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val text = matches[0]
                        _speechText.value = text
                        resetSilenceTimer(1700L) {
                            if (!hasDeliveredResult && _speechText.value.isNotBlank()) {
                                hasDeliveredResult = true
                                val committed = _speechText.value.trim()
                                stopListening()
                                onResult(committed)
                            } else {
                                stopListening()
                            }
                        }
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })

            recognizer.startListening(intent)
        } catch (e: Exception) {
            cancelSilenceTimer()
            abandonVoiceAudioFocus()
            Log.e("VoiceManager", "Failed to start speech recognition", e)
            _errorMessage.value = "Voice input error: ${e.localizedMessage ?: "Unknown"}"
            _isListening.value = false
        }
    }

    fun stopListening(markDelivered: Boolean = false) {
        if (markDelivered) {
            hasDeliveredResult = true
        }
        cancelSilenceTimer()
        abandonVoiceAudioFocus()
        _rmsDb.value = 0f
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {
        }
        _isListening.value = false
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun destroy() {
        startDelayRunnable?.let { mainHandler.removeCallbacks(it) }
        cancelSilenceTimer()
        abandonVoiceAudioFocus()
        try {
            speechRecognizer?.destroy()
        } catch (_: Exception) {
        }
        speechRecognizer = null
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}
