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
  ChevronRight,
  Keyboard,
  Camera,
  Square,
  ChevronLeft,
  Pencil,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Radio
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
  const { setActiveTab } = useAppStore()
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micError, setMicError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Voice response defaults to false so assistant replies in chat 1st without speaking
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wristos_tts_enabled') === 'true'
    }
    return false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'orb' | 'chat'>('orb')

  // Ref to hold active SpeechRecognition instance
  const recognitionRef = useRef<any>(null)

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
    }
  }, [])

  // Listen for remote AI trigger event dispatched from watch over BLE or simulator
  useEffect(() => {
    const handleRemoteTrigger = () => {
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
      text: "How can I help you today? Speak or type instructions to plan tasks, capture memories, or send wrist haptic alerts.",
      timestamp: Date.now(),
      isNew: false
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, viewMode])

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

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_) {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
  }

  const startListening = async () => {
    setMicError(null)

    // @ts-expect-error Webkit speech support
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechClass) {
      setMicError("Speech recognition is not natively supported in this browser. Please use Google Chrome, Edge, or Safari, or click any voice command button below.")
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
      const recognition = new SpeechClass()
      recognitionRef.current = recognition
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setMicError(null)
        setInterimTranscript('')
      }

      // @ts-expect-error speech event
      recognition.onresult = (event) => {
        let currentInterim = ''
        let currentFinal = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            currentFinal += item[0].transcript
          } else {
            currentInterim += item[0].transcript
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim)
          setInput(currentInterim)
        }

        if (currentFinal) {
          const finalSpeech = currentFinal.trim()
          setInput(finalSpeech)
          setInterimTranscript('')
          setIsListening(false)
          if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (_) {}
            recognitionRef.current = null
          }
          handleSend(finalSpeech)
        }
      }

      // @ts-expect-error speech event
      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error)
        setIsListening(false)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError("Microphone permission blocked. Click the microphone/lock icon in your browser URL bar and choose 'Allow', then click the mic button again.")
        } else if (event.error === 'no-speech') {
          setMicError("No speech detected. Please speak clearly into your microphone.")
        } else if (event.error === 'network') {
          setMicError("Speech recognition network timeout. You can still speak again, type, or click the quick voice presets below.")
        } else if (event.error !== 'aborted') {
          setMicError(`Voice recognition: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
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
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSimulateVoice = (command: string) => {
    setMicError(null)
    setIsListening(true)
    setInterimTranscript(command)
    setInput(command)
    setTimeout(() => {
      setIsListening(false)
      setInterimTranscript('')
      handleSend(command)
    }, 500)
  }

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev.map(m => ({ ...m, isNew: false })), userMessage])
    setInput('')
    setIsLoading(true)
    setViewMode('chat')

    try {
      const pendingTaskTitles = tasks.filter((t: TaskRecord) => !t.isCompleted).map((t: TaskRecord) => t.title)
      const memoryFacts = memories.map((m: MemoryRecord) => `${m.tag}: ${m.fact}`)

      const parsedReply = await queryAssistant({
        prompt: textToSend.trim(),
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

      setMessages((prev) => [...prev, aiMessage])
      speak(parsedReply.cleanText)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Quick suggestions directly matching reference mockup Screen 2
  const suggestions = [
    { title: 'Plan my day', query: 'Plan my day and review pending tasks', icon: Pencil },
    { title: 'Add a task', query: 'Add a task: Finish project presentation by 6:00 PM', icon: CheckSquare },
    { title: 'Set a reminder', query: 'Set a reminder to drink water in 30 minutes', icon: Bell },
    { title: 'Remember this', query: 'Remember that my focus priority is C programming', icon: BookOpen }
  ]

  const orbState = isListening ? 'listening' : isLoading ? 'thinking' : isSpeaking ? 'speaking' : 'idle'

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-7rem)] max-w-md mx-auto w-full relative">
      
      {/* Top Header Card (Matching Mockup Screen 2) */}
      <div className="flex items-center justify-between py-2 px-1 mb-2 shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveTab('dashboard')}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>AI Assistant</span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
            Voice Ready
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {/* Active "Stop Voice" button when AI is speaking */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.92 }}
                onClick={stopSpeaking}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                title="Stop AI Voice"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTts}
            className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center ${
              ttsEnabled 
                ? 'bg-purple-500/20 text-pink-300 border-pink-500/40 shadow-sm' 
                : 'bg-[#161224] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title={ttsEnabled ? "Voice Auto-Reply: ON (Speaking responses aloud)" : "Voice Auto-Reply: OFF (Replies in chat only)"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Mic Error Banner (With clear instruction & retry) */}
      <AnimatePresence>
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="mb-3 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-200 text-xs shadow-lg backdrop-blur-xl flex items-start gap-2.5 shrink-0"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <p className="font-semibold leading-relaxed">{micError}</p>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => {
                    setMicError(null)
                    startListening()
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-500/40 font-bold text-[11px] flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Mic</span>
                </button>
                <button
                  onClick={() => setMicError(null)}
                  className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-[11px] font-medium transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Voice HUD Status (Shows speech as user speaks) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="mb-3 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-purple-500/20 border border-rose-500/40 text-rose-200 text-xs shadow-[0_0_20px_rgba(244,63,94,0.35)] flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-rose-300 shrink-0">Listening:</span>
              <span className="font-mono text-white text-xs truncate">
                {interimTranscript ? `"${interimTranscript}"` : "Speak clearly now..."}
              </span>
            </div>
            <button
              onClick={stopListening}
              className="px-2 py-0.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-white text-[10px] font-bold uppercase shrink-0 transition-colors"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Stage */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 scrollbar-none">
        {viewMode === 'orb' ? (
          /* HOLOGRAPHIC ORB HERO VIEW (Matching Reference Mockup Screen 2) */
          <div className="flex flex-col items-center justify-center min-h-full py-2 space-y-4 text-center select-none">
            
            {/* Massive Glowing Holographic Orb */}
            <div className="relative py-1">
              <BreathingOrb 
                size="lg" 
                state={orbState}
                onClick={toggleMic}
              />
            </div>

            <div className="space-y-1 max-w-sm">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                How can I help you today?
              </h2>
              <p className="text-xs text-purple-200/80 font-medium">
                Tap the microphone or choose an action below to get started.
              </p>
            </div>

            {/* 4 Action Rows (Matching Reference Mockup Screen 2) */}
            <div className="w-full max-w-md space-y-2 pt-0.5">
              {suggestions.map((s, idx) => {
                const Icon = s.icon
                return (
                  <motion.button
                    key={s.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * idx, duration: 0.3 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(s.query)}
                    className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#161224] hover:bg-[#1f1933] border border-white/[0.08] hover:border-purple-500/40 text-left transition-all group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.04] group-hover:bg-purple-500/20 flex items-center justify-center transition-colors shrink-0">
                        <Icon className="w-4 h-4 text-slate-300 group-hover:text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-100">{s.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                  </motion.button>
                )
              })}
            </div>

            {/* Voice Command Quick Chips (One-tap Voice Simulation & Testing) */}
            <div className="w-full max-w-md pt-1 pb-1">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[11px] font-bold text-purple-300/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  <span>One-Tap Voice Commands</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Demo</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Plan My Day', cmd: 'Plan my day and review pending tasks' },
                  { label: 'Add 5 PM Task', cmd: 'Add a task: Review PRs and firmware tests by 5 PM' },
                  { label: 'Ping Watch', cmd: 'Send haptic alert to watch' },
                  { label: 'Remember Goal', cmd: 'Remember that health focus is 8000 daily steps' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSimulateVoice(chip.cmd)}
                    className="px-2.5 py-2 rounded-xl bg-[#140e29]/90 hover:bg-purple-500/20 border border-purple-500/25 hover:border-pink-500/40 text-[11px] text-purple-200 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-left truncate flex items-center gap-1.5 shadow-sm"
                    title={chip.cmd}
                  >
                    <span className="text-pink-400">🎙️</span>
                    <span className="truncate">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating Central Glowing Mic Button (Matching Mockup Screen 2) */}
            <div className="pt-1 flex items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setViewMode('chat')}
                className="p-3 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                title="Open Keyboard"
              >
                <Keyboard className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMic}
                className={`relative w-16 h-16 rounded-full text-white flex items-center justify-center border-2 border-white/30 transition-all ${
                  isListening
                    ? 'bg-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.9),0_0_60px_rgba(244,63,94,0.5)]'
                    : 'bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 shadow-[0_0_35px_rgba(236,72,153,0.7),0_0_60px_rgba(168,85,247,0.4)]'
                }`}
                title={isListening ? "Stop listening" : "Click to speak voice command"}
              >
                {/* Pulsating halo */}
                <motion.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ repeat: Infinity, duration: isListening ? 1.2 : 2, ease: 'easeInOut' }}
                  className={`absolute inset-0 rounded-full border-2 pointer-events-none ${
                    isListening ? 'border-rose-300' : 'border-pink-400'
                  }`}
                />
                {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => useAppStore.getState().sendWatchAlert("AI Photo Memo")}
                className="p-3 rounded-2xl bg-purple-500/10 text-cyan-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                title="Camera Capture"
              >
                <Camera className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        ) : (
          /* CHAT CONVERSATION VIEW */
          <div className="space-y-4 py-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex gap-3 max-w-xl ${m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/30 to-pink-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                      <Sparkles className="w-4 h-4 text-pink-300" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div
                      className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 text-white font-medium rounded-tr-sm shadow-xl shadow-purple-950/40 border border-purple-400/30'
                          : 'bg-gradient-to-b from-[#1c123b]/90 via-[#130d29]/85 to-[#0b081d]/95 border border-purple-500/25 text-slate-100 rounded-tl-sm shadow-lg shadow-purple-950/20 backdrop-blur-xl'
                      }`}
                    >
                      {/* Word-by-word reveal on assistant response */}
                      {m.role === 'assistant' ? (
                        <WordReveal text={m.text} animate={m.isNew} speed={25} />
                      ) : (
                        <span>{m.text}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {m.role === 'assistant' && (
                        <button
                          onClick={() => {
                            if (isSpeaking) {
                              stopSpeaking()
                            } else {
                              speak(m.text)
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-purple-300/80 hover:text-pink-300 transition-colors px-2 py-0.5 rounded-lg bg-[#140e29] border border-purple-500/20 hover:border-purple-500/40"
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
                className="flex items-center gap-3"
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
        )}
      </div>

      {/* Bottom Floating Input Bar */}
      <div className="pt-2 shrink-0 space-y-2">
        {/* Quick Voice Chips above input when in Chat View */}
        {viewMode === 'chat' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[10px] font-bold text-purple-300/70 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Radio className="w-3 h-3 text-pink-400" /> Voice:
            </span>
            {[
              { label: 'Plan Day', cmd: 'Plan my day and review pending tasks' },
              { label: 'Add Task', cmd: 'Add a task: Review PRs by 5 PM' },
              { label: 'Ping Watch', cmd: 'Send haptic alert to watch' },
              { label: 'Remember', cmd: 'Remember: Project deadline is tomorrow' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSimulateVoice(chip.cmd)}
                className="px-2 py-0.5 rounded-lg bg-[#161224] hover:bg-purple-500/20 border border-purple-500/25 text-[10px] text-purple-200 font-medium transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                🎙️ {chip.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative flex items-center p-2 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-[#191136]/90 via-[#130d29]/85 to-[#0b081d]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40"
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all mr-2 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_#f43f5e]'
                : 'bg-purple-500/15 text-pink-300 hover:bg-purple-500/25 border border-purple-500/30'
            }`}
            title={isListening ? "Stop listening" : "Click to speak voice command"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? (interimTranscript ? `"${interimTranscript}"` : "Listening to your voice...") : "Ask anything or command WristOS..."}
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder:text-purple-300/60 focus:outline-none px-2"
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-md shadow-purple-500/30 shrink-0 ml-1"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>

    </div>
  )
}
