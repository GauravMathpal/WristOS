import { useState, useRef, useEffect } from 'react'
import { db, TaskRecord, MemoryRecord } from '../lib/db'
import { taskRepository, memoryRepository } from '../lib/repository'
import { queryAssistant } from '../lib/assistantService'
import { useAppStore } from '../stores/useAppStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Zap, 
  CheckSquare, 
  Bell, 
  ChevronLeft,
  Pencil,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Radio,
  Square,
  RadioTower,
  Trash2,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { BreathingOrb } from './BreathingOrb'
import { WordReveal } from './WordReveal'

interface Message {
  id: string
  role: 'assistant' | 'user'
  text: string
  actionBadge?: string
  timestamp: number
  isNew?: boolean
}

export function AssistantScreen() {
  const { setActiveTab, triggerWatchAiRemotely } = useAppStore()
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micError, setMicError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [remoteTriggerNotice, setRemoteTriggerNotice] = useState<string | null>(null)

  // Voice response preference
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wristos_tts_enabled') === 'true'
    }
    return false
  })
  const [isLoading, setIsLoading] = useState(false)

  // Mobile mode switcher: 'orb' (Holographic Voice Center) or 'chat' (Full conversation stream)
  const [mobileViewMode, setMobileViewMode] = useState<'orb' | 'chat'>('orb')
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string>('')
  const [lastAssistantReply, setLastAssistantReply] = useState<string | null>(null)

  // Speech Recognition instance and silence timer ref
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<any>(null)
  const initialSilenceTimeoutRef = useRef<any>(null)
  const accumulatedSpeechRef = useRef<string>('')
  const hasSubmittedSpeechRef = useRef<boolean>(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Web Audio chime synthesizer
  const playWakeChime = (freq1 = 520, freq2 = 1040) => {
    try {
      // @ts-expect-error Web Audio API compatibility
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq1, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + 0.18)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.28)
      }
    } catch (_) {}
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (_) {}
        recognitionRef.current = null
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      if (initialSilenceTimeoutRef.current) {
        clearTimeout(initialSilenceTimeoutRef.current)
      }
    }
  }, [])

  // Listen for remote AI trigger event dispatched from watch over BLE or simulator
  useEffect(() => {
    const handleRemoteTrigger = () => {
      playWakeChime(580, 1160)
      setRemoteTriggerNotice("Watch initiated AI session • Listening for voice...")
      setTimeout(() => setRemoteTriggerNotice(null), 4000)
      if (!isListening) {
        startListening()
      }
    }
    window.addEventListener('wristos-ai-trigger', handleRemoteTrigger)
    return () => window.removeEventListener('wristos-ai-trigger', handleRemoteTrigger)
  }, [isListening])

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const toggleTts = () => {
    const next = !ttsEnabled
    setTtsEnabled(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('wristos_tts_enabled', String(next))
    }
    if (!next) {
      stopSpeaking()
    }
  }

  const tasks = useLiveQuery(() => db.tasks.filter(t => !t.deletedAt).toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.filter(m => !m.deletedAt).toArray(), []) || []

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-0',
      role: 'assistant',
      text: "WristOS Intelligence is online. Tap the microphone or speak a command to plan tasks, capture memories, or dispatch watch haptic alerts.",
      timestamp: Date.now(),
      isNew: false
    }
  ])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isLoading])

  const speak = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Alex')) && v.lang.startsWith('en'))
      if (preferred) {
        utterance.voice = preferred
      }
      utterance.rate = 1.05
      utterance.pitch = 1.0
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn("Speech synthesis error:", e)
      setIsSpeaking(false)
    }
  }

  const handleSend = async (manualText?: string) => {
    const textToSend = (manualText !== undefined ? manualText : input).trim()
    if (!textToSend || isLoading) return

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    setLastSubmittedPrompt(textToSend)

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev.map(m => ({ ...m, isNew: false })), userMessage])
    setInput('')
    setInterimTranscript('')
    accumulatedSpeechRef.current = ''
    setIsLoading(true)

    // Unconditionally redirect and open the chat view so conversation and AI response are immediately visible
    setMobileViewMode('chat')

    try {
      const pendingTaskTitles = tasks.filter((t: TaskRecord) => !t.isCompleted).map((t: TaskRecord) => t.title)
      const memoryFacts = memories.map((m: MemoryRecord) => `${m.tag}: ${m.fact}`)

      const parsedReply = await queryAssistant({
        prompt: textToSend,
        memories: memoryFacts,
        tasks: pendingTaskTitles
      })

      let actionBadge: string | undefined = undefined

      if (parsedReply.action.type === 'TASK' && parsedReply.action.task) {
        await taskRepository.add(parsedReply.action.task.title, parsedReply.action.task.dueTime)
        actionBadge = `Added to Agenda: "${parsedReply.action.task.title}"`
      } else if (parsedReply.action.type === 'MEMORY' && parsedReply.action.memory) {
        await memoryRepository.add(parsedReply.action.memory.tag, parsedReply.action.memory.fact)
        actionBadge = `Vault Saved: [${parsedReply.action.memory.tag}]`
      } else if (parsedReply.action.type === 'ALERT' && parsedReply.action.alert) {
        useAppStore.getState().sendWatchAlert(parsedReply.action.alert.message)
        actionBadge = `Watch Alert Dispatched: "${parsedReply.action.alert.message}"`
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: parsedReply.cleanText,
        actionBadge,
        timestamp: Date.now(),
        isNew: true
      }

      setLastAssistantReply(parsedReply.cleanText)
      setMessages((prev) => [...prev, aiMessage])
      speak(parsedReply.cleanText)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const commitVoiceSubmission = (speechText: string) => {
    const trimmed = speechText.trim()
    if (!trimmed || hasSubmittedSpeechRef.current) return
    hasSubmittedSpeechRef.current = true

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    if (initialSilenceTimeoutRef.current) {
      clearTimeout(initialSilenceTimeoutRef.current)
      initialSilenceTimeoutRef.current = null
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
    setInput('')
    accumulatedSpeechRef.current = ''

    // Automatically redirect and open the chat section
    setMobileViewMode('chat')

    handleSend(trimmed)
  }

  const stopListening = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    if (initialSilenceTimeoutRef.current) {
      clearTimeout(initialSilenceTimeoutRef.current)
      initialSilenceTimeoutRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (_) {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
    accumulatedSpeechRef.current = ''
  }

  const startListening = async () => {
    setMicError(null)
    hasSubmittedSpeechRef.current = false
    accumulatedSpeechRef.current = ''
    setInterimTranscript('')

    // 1. Proactively request microphone audio permissions if browser requires it
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Immediately release dummy stream so SpeechRecognition can bind to hardware mic
        stream.getTracks().forEach(t => t.stop())
      } catch (permErr: any) {
        console.warn("Media stream mic check:", permErr)
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setMicError("Microphone permission was blocked. Please click the lock icon in your browser URL bar, enable Microphone access, and try again.")
          return
        }
      }
    }

    // 2. Instantiate Web Speech API
    // @ts-expect-error Webkit speech support
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechClass) {
      setMicError("Web Speech Recognition is not natively supported in this browser. Please use Google Chrome, Edge, or Safari, or click any voice command button below.")
      return
    }

    // Stop existing instance if still running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (_) {}
      recognitionRef.current = null
    }

    try {
      playWakeChime(440, 880)
      const recognition = new SpeechClass()
      recognitionRef.current = recognition
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setMicError(null)
        setInterimTranscript('')
        hasSubmittedSpeechRef.current = false
        accumulatedSpeechRef.current = ''

        // Initial silence auto-stop: if user doesn't say anything after 3.5s, auto-stop and redirect to chat
        if (initialSilenceTimeoutRef.current) {
          clearTimeout(initialSilenceTimeoutRef.current)
        }
        initialSilenceTimeoutRef.current = setTimeout(() => {
          if (!hasSubmittedSpeechRef.current && !accumulatedSpeechRef.current.trim()) {
            stopListening()
            // Automatically redirect and open the chat section
            setMobileViewMode('chat')
          }
        }, 3500)
      }

      // @ts-expect-error speech event
      recognition.onresult = (event) => {
        let finalChunk = ''
        let interimChunk = ''

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            finalChunk += item[0].transcript + ' '
          } else {
            interimChunk += item[0].transcript
          }
        }

        const candidateText = (finalChunk + interimChunk).trim()

        if (candidateText) {
          // Clear initial silence timer since user spoke
          if (initialSilenceTimeoutRef.current) {
            clearTimeout(initialSilenceTimeoutRef.current)
            initialSilenceTimeoutRef.current = null
          }

          accumulatedSpeechRef.current = candidateText
          setInterimTranscript(candidateText)
          setInput(candidateText)

          // Auto-submit after 1.5s of silence after speech pause
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }
          silenceTimeoutRef.current = setTimeout(() => {
            commitVoiceSubmission(accumulatedSpeechRef.current)
          }, 1500)
        }
      }

      // @ts-expect-error speech event
      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false)
          setMicError("Microphone permission blocked. Click the microphone/lock icon in your browser URL bar and choose 'Allow', then click the mic button again.")
        } else if (event.error === 'no-speech') {
          // When recognition reports no-speech, stop and redirect to chat
          stopListening()
          setMobileViewMode('chat')
        } else if (event.error === 'network') {
          setIsListening(false)
          setMicError("Speech recognition network timeout. You can speak again, type, or click the quick voice presets below.")
        } else if (event.error !== 'aborted') {
          setIsListening(false)
          setMicError(`Voice recognition: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
        if (initialSilenceTimeoutRef.current) {
          clearTimeout(initialSilenceTimeoutRef.current)
          initialSilenceTimeoutRef.current = null
        }
        // If recognition ended naturally with unsubmitted speech, submit it!
        if (accumulatedSpeechRef.current.trim() && !hasSubmittedSpeechRef.current) {
          commitVoiceSubmission(accumulatedSpeechRef.current)
        } else {
          // Redirect to chat section
          setMobileViewMode('chat')
        }
      }

      recognition.start()
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err)
      setIsListening(false)
      recognitionRef.current = null
      setMicError(`Unable to start speech recognition: ${err.message || 'Unknown error'}. You can click the voice test buttons below.`)
    }
  }

  const toggleMic = () => {
    if (isListening) {
      const speechToCommit = accumulatedSpeechRef.current.trim() || interimTranscript.trim() || input.trim()
      if (speechToCommit) {
        commitVoiceSubmission(speechToCommit)
      } else {
        stopListening()
        // Manually stopped with no speech: redirect and open chat section
        setMobileViewMode('chat')
      }
    } else {
      startListening()
    }
  }

  const handleSimulateVoice = (command: string) => {
    setMicError(null)
    setIsListening(true)
    setInterimTranscript(command)
    setInput(command)
    accumulatedSpeechRef.current = command
    setTimeout(() => {
      setIsListening(false)
      setInterimTranscript('')
      commitVoiceSubmission(command)
    }, 450)
  }

  const handleClearMessages = () => {
    stopSpeaking()
    if (isListening) {
      stopListening()
    }
    setMessages([
      {
        id: `m-${Date.now()}`,
        role: 'assistant',
        text: "Chat cleared. What goals, tasks, or watch metrics can I help you with?",
        timestamp: Date.now(),
        isNew: false
      }
    ])
    setLastSubmittedPrompt('')
    setLastAssistantReply(null)
    setInput('')
    setInterimTranscript('')
  }

  // Quick prompt suggestions
  const suggestions = [
    { title: 'Plan my day', query: 'Plan my day and review pending tasks', icon: Pencil },
    { title: 'Add a task', query: 'Add a task: Review firmware tests by 5:00 PM', icon: CheckSquare },
    { title: 'Set a reminder', query: 'Set a reminder to drink water in 30 minutes', icon: Bell },
    { title: 'Save to Vault', query: 'Remember that my priority is C++ FreeRTOS firmware', icon: BookOpen }
  ]

  const orbState = isListening ? 'listening' : isLoading ? 'thinking' : isSpeaking ? 'speaking' : 'idle'

  return (
    <div className="w-full max-w-6xl mx-auto flex-1 min-h-[calc(100dvh-10rem)] lg:h-[calc(100vh-8.5rem)] flex flex-col space-y-3 sm:space-y-4 pb-2 sm:pb-4">
      
      {/* 1. TOP HEADER & MOBILE SWITCHER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-[#140e29]/75 border border-purple-500/20 backdrop-blur-xl shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 rounded-2xl bg-[#1c133a] border border-white/[0.1] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md shrink-0"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>WristOS AI Intelligence</span>
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : isLoading
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {isListening ? 'Listening' : isLoading ? 'Synthesizing' : isSpeaking ? 'Speaking' : 'Voice Ready'}
              </span>
            </div>
            <p className="text-[11px] text-purple-300/80 font-medium">
              Multimodal assistant powered by Gemini 3.8 Flash • Watch-to-phone bidirectional bridge
            </p>
          </div>
        </div>

        {/* Action Controls & Mobile Tab Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          
          {/* Mobile Orb vs Chat View Toggle (< lg screens) */}
          <div className="lg:hidden flex items-center p-1 rounded-xl bg-[#0e091e] border border-white/10 text-xs font-bold">
            <button
              onClick={() => setMobileViewMode('orb')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mobileViewMode === 'orb' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voice Orb
            </button>
            <button
              onClick={() => setMobileViewMode('chat')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mobileViewMode === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat ({messages.length})
            </button>
          </div>

          {/* Active Stop Button when AI is speaking */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.92 }}
                onClick={stopSpeaking}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                title="Stop Speaking"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* TTS Read-Aloud Toggle */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTts}
            className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center ${
              ttsEnabled 
                ? 'bg-purple-500/20 text-pink-300 border-pink-500/40 shadow-sm' 
                : 'bg-[#161224] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title={ttsEnabled ? "Voice Auto-Reply: ON (Speaking aloud)" : "Voice Auto-Reply: OFF (Text only)"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* Clear Messages */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleClearMessages}
            className="px-3 py-1.5 rounded-xl bg-[#161224] text-slate-300 border border-white/[0.08] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            title="Clear Chat History and start fresh"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Clear Chat</span>
          </motion.button>
        </div>
      </div>

      {/* 2. REMOTE WATCH TRIGGER BANNER */}
      <AnimatePresence>
        {remoteTriggerNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-200 text-xs shadow-xl backdrop-blur-xl flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-2.5">
              <RadioTower className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wide">{remoteTriggerNotice}</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-100">
              BLE 0xAA OK
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MIC ERROR BANNER */}
      <AnimatePresence>
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs shadow-xl backdrop-blur-xl flex items-start justify-between gap-3 shrink-0"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold leading-relaxed">{micError}</p>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  Tip: You can click the one-tap preset buttons below to test voice actions instantly.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMicError(null)
                startListening()
              }}
              className="px-3 py-1 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 text-white font-bold text-xs border border-rose-500/40 shrink-0 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN RESPONSIVE COCKPIT: LEFT (ORB & VOICE HUD) | RIGHT (CHAT & ACTIONS) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 items-stretch">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: HOLOGRAPHIC ORB & VOICE COMMAND CENTER       */}
        {/* ========================================================= */}
        <div className={`lg:col-span-5 flex flex-col justify-between p-6 rounded-3xl bg-[#140e29]/75 border border-purple-500/25 backdrop-blur-xl shadow-2xl relative overflow-hidden ${
          mobileViewMode === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Ambient Glow Orb Backdrop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-600/15 blur-[80px] pointer-events-none" />

          {/* Central Breathing Orb */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto select-none">
            <div className="relative">
              <BreathingOrb 
                size="lg" 
                state={orbState}
                onClick={toggleMic}
              />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                {isListening ? "Listening for command..." : isLoading ? "Thinking..." : "How can I help you?"}
              </h3>
              <p className="text-xs text-purple-200/80 font-medium mt-1">
                {isListening 
                  ? "Speak clearly into your microphone" 
                  : "Tap the mic below or trigger directly from your watch"}
              </p>
            </div>

            {/* LIVE ANIMATED AUDIO EQUALIZER SOUNDWAVE BARS */}
            <div className="flex items-center justify-center gap-1 h-8 pt-1">
              {[30, 65, 45, 90, 70, 100, 85, 95, 60, 75, 40, 80].map((h, i) => (
                <motion.div
                  key={i}
                  animate={isListening || isSpeaking ? { 
                    height: [`${h * 0.3}%`, `${h}%`, `${h * 0.6}%`, `${h * 0.9}%`] 
                  } : { height: '18%' }}
                  transition={{ 
                    duration: isListening ? 0.9 : 1.4, 
                    repeat: Infinity, 
                    delay: i * 0.08,
                    ease: "easeInOut"
                  }}
                  className={`w-1.5 rounded-full transition-all ${
                    isListening 
                      ? 'bg-gradient-to-t from-rose-500 via-pink-500 to-amber-400' 
                      : isSpeaking 
                      ? 'bg-gradient-to-t from-purple-500 to-cyan-400' 
                      : 'bg-purple-500/25'
                  }`}
                />
              ))}
            </div>

            {/* Live Teleprompter HUD & Voice Bridge */}
            <div className="w-full max-w-sm mx-auto">
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="teleprompter-listening"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-purple-500/20 border border-rose-500/40 text-left shadow-[0_0_20px_rgba(244,63,94,0.2)] backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        Live Voice Teleprompter
                      </span>
                      <span className="text-[10px] text-pink-300/80 font-medium font-mono">Auto-submits on pause</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium italic break-words min-h-[1.5rem]">
                      {interimTranscript ? `"${interimTranscript}"` : "Listening... Speak your request"}
                    </p>
                    {interimTranscript && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-center justify-between">
                        <span className="text-[10px] text-rose-300/70 font-mono">1.4s silence auto-sends</span>
                        <button
                          type="button"
                          onClick={() => commitVoiceSubmission(accumulatedSpeechRef.current || interimTranscript)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Send className="w-3 h-3 text-emerald-300" />
                          <span>Teleprompt Now</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : isLoading ? (
                  <motion.div
                    key="teleprompter-loading"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="p-3.5 rounded-2xl bg-[#1b1238]/90 border border-purple-500/30 text-left shadow-lg backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                      <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider font-bold">
                        Teleprompted to AI Chat
                      </span>
                    </div>
                    {lastSubmittedPrompt && (
                      <p className="text-xs text-purple-200 line-clamp-2 italic font-medium">
                        "{lastSubmittedPrompt}"
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>Synthesizing Gemini 3.8 Flash reply...</span>
                    </div>
                  </motion.div>
                ) : lastAssistantReply ? (
                  <motion.div
                    key="teleprompter-reply"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="p-3.5 rounded-2xl bg-[#140e29]/90 border border-purple-500/20 text-left shadow-lg backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        AI Response
                      </span>
                      <button
                        type="button"
                        onClick={() => setMobileViewMode('chat')}
                        className="text-[10px] text-purple-300 hover:text-white font-medium underline"
                      >
                        Open Chat ({messages.length}) →
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      {lastAssistantReply}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Tactile Microphone & Watch Wake Controls */}
          <div className="space-y-4 pt-3 border-t border-white/[0.06] relative z-10">
            
            {/* Big Tactile Glowing Mic Button */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={triggerWatchAiRemotely}
                className="px-3.5 py-2.5 rounded-2xl bg-[#1c133a] hover:bg-[#251a4d] border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                title="Simulate Watch-to-Phone BLE 0xAA wake trigger"
              >
                <RadioTower className="w-4 h-4 text-cyan-400" />
                <span>Watch Wake Test</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleMic}
                className={`relative w-16 h-16 rounded-full text-white flex items-center justify-center border-2 border-white/30 transition-all ${
                  isListening
                    ? 'bg-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.9),0_0_60px_rgba(244,63,94,0.5)]'
                    : 'bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 shadow-[0_0_35px_rgba(236,72,153,0.7),0_0_60px_rgba(168,85,247,0.4)]'
                }`}
                title={isListening ? "Click to finish & send voice command" : "Click to speak voice command"}
              >
                {/* Pulsating halo */}
                <motion.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ repeat: Infinity, duration: isListening ? 1.2 : 2.5, ease: 'easeInOut' }}
                  className={`absolute inset-0 rounded-full border-2 pointer-events-none ${
                    isListening ? 'border-rose-300' : 'border-pink-400'
                  }`}
                />
                {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
              </motion.button>

              {isListening && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    const text = accumulatedSpeechRef.current.trim() || interimTranscript.trim() || input.trim()
                    if (text) {
                      commitVoiceSubmission(text)
                    } else {
                      stopListening()
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 animate-pulse"
                  title="Teleprompt speech directly to chat & get reply"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Send to Chat</span>
                </motion.button>
              )}
            </div>

            {/* One-Tap Voice Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-purple-300/80 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 text-pink-400" /> Quick Voice Commands
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1-Tap</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Plan My Day', cmd: 'Plan my day and review pending tasks' },
                  { label: 'Add 5 PM Task', cmd: 'Add a task: Review firmware tests by 5 PM' },
                  { label: 'Ping Watch', cmd: 'Send haptic alert to watch' },
                  { label: 'Save Goal', cmd: 'Remember that health focus is 10000 daily steps' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSimulateVoice(chip.cmd)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#16102c]/90 hover:bg-purple-500/20 border border-purple-500/20 text-[11px] text-purple-200 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-left truncate flex items-center gap-1.5"
                    title={chip.cmd}
                  >
                    <span className="text-pink-400 shrink-0">🎙️</span>
                    <span className="truncate">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE CONVERSATION THREAD             */}
        {/* ========================================================= */}
        <div className={`lg:col-span-7 flex flex-col justify-between p-6 rounded-3xl bg-[#140e29]/75 border border-purple-500/25 backdrop-blur-xl shadow-2xl min-h-0 ${
          mobileViewMode === 'orb' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Conversation Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h4 className="text-sm font-extrabold text-white">Conversation Stream</h4>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-purple-300 font-semibold hidden sm:inline">
                {messages.length} messages
              </span>
              <button
                type="button"
                onClick={handleClearMessages}
                className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-purple-500/20 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Clear conversation and start fresh"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-purple-500/20">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'ml-auto justify-end max-w-lg' : 'mr-auto justify-start max-w-xl'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/30 to-pink-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 mt-1 shadow-md">
                      <Sparkles className="w-4 h-4 text-pink-300" />
                    </div>
                  )}

                  <div className="space-y-1.5 max-w-full">
                    <div
                      className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed break-words ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 text-white font-medium rounded-tr-sm shadow-xl shadow-purple-950/40 border border-purple-400/30'
                          : 'bg-gradient-to-b from-[#1c123b]/90 via-[#130d29]/85 to-[#0b081d]/95 border border-purple-500/25 text-slate-100 rounded-tl-sm shadow-lg shadow-purple-950/20 backdrop-blur-xl'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <WordReveal text={m.text} animate={m.isNew} speed={25} />
                      ) : (
                        <span>{m.text}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {m.role === 'assistant' && (
                        <button
                          onClick={() => {
                            if (isSpeaking) {
                              stopSpeaking()
                            } else {
                              speak(m.text)
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-purple-300 hover:text-pink-300 transition-colors px-2 py-0.5 rounded-lg bg-[#140e29] border border-purple-500/20 hover:border-purple-500/40"
                          title={isSpeaking ? "Stop Voice" : "Listen to response"}
                        >
                          {isSpeaking ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current text-rose-400" />
                              <span className="text-rose-400">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-2.5 h-2.5 text-purple-400" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}

                      {m.actionBadge && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                        >
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span>{m.actionBadge}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 pt-1"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-4 h-4 animate-spin text-pink-400" />
                </div>
                <div className="p-3.5 rounded-2xl bg-[#140e29]/80 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Synthesizing intelligence & context...</span>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions & Input Bar */}
          <div className="pt-3 shrink-0 space-y-2 border-t border-white/[0.06]">
            
            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {suggestions.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.title}
                    onClick={() => handleSend(s.query)}
                    className="px-2.5 py-1 rounded-xl bg-[#140e29] hover:bg-purple-500/20 border border-purple-500/20 text-[11px] text-slate-300 hover:text-white font-medium transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <Icon className="w-3 h-3 text-purple-400" />
                    <span>{s.title}</span>
                  </button>
                )
              })}
            </div>

            {/* Smart Message Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (isListening) {
                  const toSubmit = accumulatedSpeechRef.current.trim() || interimTranscript.trim() || input.trim()
                  if (toSubmit) {
                    commitVoiceSubmission(toSubmit)
                  } else {
                    stopListening()
                  }
                } else {
                  handleSend()
                }
              }}
              className="relative flex items-center p-2 rounded-2xl border border-purple-500/30 bg-[#0d091e] backdrop-blur-2xl shadow-xl"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={toggleMic}
                className={`p-2.5 rounded-xl transition-all mr-2 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_#f43f5e]'
                    : 'bg-purple-500/15 text-pink-300 hover:bg-purple-500/25 border border-purple-500/30'
                }`}
                title={isListening ? "Finish and send voice command" : "Click to speak voice command"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </motion.button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? (interimTranscript ? `"${interimTranscript}"` : "Listening to your voice...") : "Ask anything or command WristOS..."}
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder:text-purple-300/50 focus:outline-none px-2"
              />

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                disabled={(!input.trim() && !interimTranscript.trim()) || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-md shadow-purple-500/30 shrink-0 ml-1"
                title="Send message to AI assistant"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

          </div>

        </div>

      </div>

    </div>
  )
}
