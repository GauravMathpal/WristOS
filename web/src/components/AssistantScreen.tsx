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
  Brain, 
  Calendar,
  ChevronRight,
  Keyboard,
  Camera,
  History,
  Square
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
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
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

  // Cancel any speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

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
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    // @ts-expect-error Webkit speech support
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechClass()
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    // @ts-expect-error speech event
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      handleSend(transcript)
    }

    recognition.start()
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
    { title: 'Add a task', query: 'Add task: Finish C assignment by 6:00 PM', icon: CheckSquare, color: 'from-blue-500/30 to-indigo-500/20 text-cyan-300 border-cyan-500/30' },
    { title: 'Set a reminder', query: 'Set a reminder to drink water in 30 minutes', icon: Bell, color: 'from-pink-500/30 to-rose-500/20 text-pink-300 border-pink-500/30' },
    { title: 'Remember this', query: 'Remember that I have a presentation with Dhruv on Friday', icon: Brain, color: 'from-amber-500/30 to-orange-500/20 text-amber-300 border-amber-500/30' },
    { title: 'Plan my day', query: 'Plan my day and review pending tasks', icon: Calendar, color: 'from-purple-500/30 to-fuchsia-500/20 text-purple-300 border-purple-500/30' }
  ]

  const orbState = isListening ? 'listening' : isLoading ? 'thinking' : isSpeaking ? 'speaking' : 'idle'

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-7rem)] relative">
      
      {/* Top Header Card */}
      <div className="flex items-center justify-between p-4 mb-3 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shrink-0 shadow-lg shadow-purple-950/25">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <BreathingOrb size="sm" state={orbState} className="!w-10 !h-10" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white flex items-center gap-2">
              <span>WristOS Intelligence</span>
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-cyan-400 animate-ping' : 'bg-purple-400 shadow-[0_0_8px_#c084fc]'}`} />
            </div>
            <div className="text-[10px] text-purple-300 font-mono font-medium">
              {memories.length} FACTS • {tasks.filter(t => !t.isCompleted).length} TASKS IN CONTEXT
            </div>
          </div>
        </div>

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
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                title="Stop AI Voice"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Voice</span>
              </motion.button>
            )}
          </AnimatePresence>

          {messages.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setViewMode(viewMode === 'orb' ? 'chat' : 'orb')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>{viewMode === 'orb' ? 'View Chat' : 'View Orb'}</span>
            </motion.button>
          )}

          {/* Voice Auto-Reply Toggle (Default: Muted / Chat 1st) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTts}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              ttsEnabled 
                ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm' 
                : 'bg-[#140e29] text-purple-300/70 border-purple-500/25 hover:text-white'
            }`}
            title={ttsEnabled ? "Voice Auto-Reply: ON (Click to mute)" : "Voice Auto-Reply: OFF (Replies in chat only)"}
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5 text-pink-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{ttsEnabled ? 'Voice: On' : 'Voice: Muted'}</span>
          </motion.button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 scrollbar-none">
        {viewMode === 'orb' ? (
          /* HOLOGRAPHIC ORB HERO VIEW (Matching Reference Mockup Screen 2) */
          <div className="flex flex-col items-center justify-center min-h-full py-4 space-y-6 text-center select-none">
            
            {/* Massive Glowing Holographic Orb */}
            <div className="relative py-2">
              <BreathingOrb 
                size="lg" 
                state={orbState}
                onClick={toggleMic}
              />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                How can I help you today?
              </h2>
              <p className="text-xs text-purple-200/80 font-medium">
                Tap the microphone or choose an action below to get started.
              </p>
            </div>

            {/* 4 Action Rows (Matching Reference Mockup Screen 2) */}
            <div className="w-full max-w-md space-y-2.5 pt-1">
              {suggestions.map((s, idx) => {
                const Icon = s.icon
                return (
                  <motion.button
                    key={s.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.35 }}
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSend(s.query)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#1a1236]/80 via-[#130d29]/75 to-[#0b081d]/90 hover:from-[#221747]/90 hover:to-[#170e33]/95 border border-purple-500/25 hover:border-purple-400/50 text-left transition-all group shadow-md shadow-purple-950/20"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${s.color} border flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(168,85,247,0.3)]`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-100">{s.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-pink-400 transition-colors" />
                  </motion.button>
                )
              })}
            </div>

            {/* Floating Central Glowing Mic Button (Matching Mockup Screen 2) */}
            <div className="pt-2 flex items-center justify-center gap-6">
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
                className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(236,72,153,0.7),0_0_60px_rgba(168,85,247,0.4)] border-2 border-white/30"
              >
                {/* Pulsating halo */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border-2 border-pink-400 pointer-events-none"
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
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel()
                                const utterance = new SpeechSynthesisUtterance(m.text)
                                utterance.onstart = () => setIsSpeaking(true)
                                utterance.onend = () => setIsSpeaking(false)
                                utterance.onerror = () => setIsSpeaking(false)
                                window.speechSynthesis.speak(utterance)
                              }
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
      <div className="pt-3 shrink-0">
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
            title="Speech input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Ask anything or command WristOS..."}
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
