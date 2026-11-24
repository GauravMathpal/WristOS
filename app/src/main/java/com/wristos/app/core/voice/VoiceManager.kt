package com.wristos.app.core.voice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

class VoiceManager(context: Context) {
    private val appContext = context.applicationContext

    // Text to Speech
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    // Speech to Text
    private var speechRecognizer: SpeechRecognizer? = null
    private var silenceRunnable: Runnable? = null
    private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())

    private val _isListening = MutableStateFlow(false)
    val isListening: StateFlow<Boolean> = _isListening.asStateFlow()

    private val _speechText = MutableStateFlow("")
    val speechText: StateFlow<String> = _speechText.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _ttsEnabled = MutableStateFlow(true)
    val ttsEnabled: StateFlow<Boolean> = _ttsEnabled.asStateFlow()

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

    fun speak(text: String) {
        if (isTtsReady && _ttsEnabled.value && text.isNotBlank()) {
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "WristOSTTS_${System.currentTimeMillis()}")
        }
    }

    fun stopSpeaking() {
        textToSpeech?.stop()
    }

    fun setTtsEnabled(enabled: Boolean) {
        _ttsEnabled.value = enabled
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
        mainHandler.post {
            try {
                // Check microphone permission before calling SpeechRecognizer
                if (androidx.core.content.ContextCompat.checkSelfPermission(
                        appContext,
                        android.Manifest.permission.RECORD_AUDIO
                    ) != android.content.pm.PackageManager.PERMISSION_GRANTED
                ) {
                    _errorMessage.value = "Microphone permission required. Please allow audio access."
                    _isListening.value = false
                    return@post
                }

                if (!SpeechRecognizer.isRecognitionAvailable(appContext)) {
                    android.util.Log.w("VoiceManager", "Speech recognition service not available on device")
                    _errorMessage.value = "Speech recognition is not available on this device."
                    _isListening.value = false
                    return@post
                }

                _errorMessage.value = null
                _speechText.value = ""
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
                        // Silence timer: if no speech is heard within 4 seconds, auto-stop
                        resetSilenceTimer(4000L) {
                            android.util.Log.d("VoiceManager", "Auto-stopping voice input due to initial silence")
                            stopListening()
                        }
                    }

                    override fun onBeginningOfSpeech() {
                        cancelSilenceTimer()
                    }
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        cancelSilenceTimer()
                        _isListening.value = false
                    }

                    override fun onError(error: Int) {
                        cancelSilenceTimer()
                        android.util.Log.w("VoiceManager", "SpeechRecognizer error: $error")
                        val errorDesc = when (error) {
                            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                            SpeechRecognizer.ERROR_CLIENT -> "Speech recognizer client error"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission not granted"
                            SpeechRecognizer.ERROR_NETWORK -> "Network connection error for speech"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized. Tap mic to retry."
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy. Please wait a moment."
                            SpeechRecognizer.ERROR_SERVER -> "Google speech server error"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected. Tap mic to speak."
                            else -> "Speech recognition error ($error)"
                        }
                        _errorMessage.value = errorDesc
                        _isListening.value = false
                    }

                    override fun onResults(results: Bundle?) {
                        cancelSilenceTimer()
                        _isListening.value = false
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            val recognized = matches[0]
                            _speechText.value = recognized
                            onResult(recognized)
                        } else if (_speechText.value.isNotBlank()) {
                            onResult(_speechText.value)
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            val text = matches[0]
                            _speechText.value = text
                            // Inter-speech silence timer: auto-commit if user stops talking for 1.8s
                            resetSilenceTimer(1800L) {
                                android.util.Log.d("VoiceManager", "Auto-committing voice after pause")
                                stopListening()
                                if (_speechText.value.isNotBlank()) {
                                    onResult(_speechText.value)
                                }
                            }
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                cancelSilenceTimer()
                android.util.Log.e("VoiceManager", "Failed to start speech recognition", e)
                _errorMessage.value = "Voice input error: ${e.localizedMessage ?: "Unknown"}"
                _isListening.value = false
            }
        }
    }

    fun stopListening() {
        cancelSilenceTimer()
        speechRecognizer?.stopListening()
        _isListening.value = false
    }

    fun destroy() {
        cancelSilenceTimer()
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}
