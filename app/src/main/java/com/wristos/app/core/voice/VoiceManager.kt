package com.wristos.app.core.voice

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
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
    private var silenceRunnable: Runnable? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var hasDeliveredResult = false
    private var busyRetryUsed = false

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

    fun startListening(onResult: (String) -> Unit) {
        busyRetryUsed = false
        startListeningInternal(onResult)
    }

    private fun startListeningInternal(onResult: (String) -> Unit) {
        mainHandler.post {
            try {
                if (ContextCompat.checkSelfPermission(
                        appContext,
                        android.Manifest.permission.RECORD_AUDIO
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    _errorMessage.value = "Microphone permission required. Please allow audio access."
                    _isListening.value = false
                    return@post
                }

                if (!SpeechRecognizer.isRecognitionAvailable(appContext)) {
                    Log.w("VoiceManager", "Speech recognition service not available on device")
                    _errorMessage.value = "Speech recognition is not available on this device."
                    _isListening.value = false
                    return@post
                }

                _errorMessage.value = null
                _speechText.value = ""
                _rmsDb.value = 0f
                hasDeliveredResult = false
                stopSpeaking()
                cancelSilenceTimer()
                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(appContext)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                }

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
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
                        _isListening.value = false
                        _rmsDb.value = 0f
                    }

                    override fun onError(error: Int) {
                        cancelSilenceTimer()
                        _rmsDb.value = 0f
                        Log.w("VoiceManager", "SpeechRecognizer error: $error")

                        // If screen just woke and recognizer wasn't released cleanly, retry once
                        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY && !busyRetryUsed) {
                            busyRetryUsed = true
                            _isListening.value = false
                            mainHandler.postDelayed({ startListeningInternal(onResult) }, 350L)
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
                            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                            SpeechRecognizer.ERROR_CLIENT -> "Speech recognizer reset — tap mic to retry"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission not granted"
                            SpeechRecognizer.ERROR_NETWORK -> "Network connection error for speech"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized. Tap the Orb to retry."
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy. Tap the Orb to retry."
                            SpeechRecognizer.ERROR_SERVER -> "Speech server error"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected. Tap the Orb to speak."
                            else -> "Speech recognition error ($error)"
                        }
                        _errorMessage.value = errorDesc
                        _isListening.value = false
                    }

                    override fun onResults(results: Bundle?) {
                        cancelSilenceTimer()
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

                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                cancelSilenceTimer()
                Log.e("VoiceManager", "Failed to start speech recognition", e)
                _errorMessage.value = "Voice input error: ${e.localizedMessage ?: "Unknown"}"
                _isListening.value = false
            }
        }
    }

    fun stopListening(markDelivered: Boolean = false) {
        if (markDelivered) {
            hasDeliveredResult = true
        }
        cancelSilenceTimer()
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
        cancelSilenceTimer()
        try {
            speechRecognizer?.destroy()
        } catch (_: Exception) {
        }
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}
