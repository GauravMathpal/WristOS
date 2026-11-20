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
  User, 
  CheckSquare, 
  Bell, 
  Brain, 
  Calendar,
  ChevronRight
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
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'orb' | 'chat'>('orb')

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

  // Quick suggestions from the design mockup
  const suggestions = [
    { title: 'Add a task', query: 'Add task: Finish CS assignment by 6:00 PM', icon: CheckSquare },
    { title: 'Set a reminder', query: 'Set a reminder to drink water in 30 minutes', icon: Bell },
    { title: 'Remember this', query: 'Remember that I prefer running at 7:00 AM', icon: Brain },
    { title: 'Plan my day', query: 'Plan my productive schedule for today', icon: Calendar }
  ]

  const orbState = isListening ? 'listening' : isLoading ? 'thinking' : isSpeaking ? 'speaking' : 'idle'

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-7rem)]">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3.5 mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BreathingOrb size="sm" state={orbState} className="!w-9 !h-9" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>WristOS Intelligence</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-cyan-400 animate-ping' : 'bg-purple-400'}`} />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {memories.length} FACTS • {tasks.filter(t => !t.isCompleted).length} TASKS IN CONTEXT
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(viewMode === 'orb' ? 'chat' : 'orb')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-all"
            >
              {viewMode === 'orb' ? 'Show Chat' : 'Show Orb'}
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-xl text-xs font-medium transition-all ${
              ttsEnabled ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-transparent text-slate-500 hover:text-slate-300'
            }`}
            title="Speech Synthesis"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        
        {/* ORB HERO VIEW (Mockup Screen 2) */}
        {viewMode === 'orb' ? (
          <div className="flex flex-col items-center justify-center min-h-[420px] py-6 text-center space-y-6">
            
            {/* Hypnotic Breathing Orb */}
            <div className="relative my-2">
              <BreathingOrb 
                size="lg" 
                state={orbState}
                onClick={toggleMic}
              />
            </div>

            {/* Prompt Greeting */}
            <div className="space-y-1.5 max-w-sm">
              <motion.h2 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold tracking-tight text-white"
              >
                How can I help you today?
              </motion.h2>
              <p className="text-xs text-slate-400">
                Tap the orb to speak, choose a prompt below, or type your request.
              </p>
            </div>

            {/* Suggestion Action Rows (From Mockup Image) */}
            <div className="w-full max-w-sm space-y-2 pt-2">
              {suggestions.map((s, idx) => {
                const Icon = s.icon
                return (
                  <motion.button
                    key={s.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.3 }}
                    whileHover={{ scale: 1.015, x: 2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSend(s.query)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-500/30 text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{s.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  </motion.button>
                )
              })}
            </div>
          </div>
        ) : (
          /* CHAT CONVERSATION VIEW */
          <div className="space-y-4 py-2">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 max-w-xl ${m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-400/25 text-purple-300 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-tr-sm shadow-md shadow-purple-600/20'
                          : 'bg-[#120f20]/90 border border-purple-500/20 text-slate-100 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {/* Word-by-word reveal on assistant response */}
                      {m.role === 'assistant' ? (
                        <WordReveal text={m.text} animate={m.isNew} speed={30} />
                      ) : (
                        <span>{m.text}</span>
                      )}
                    </div>

                    {m.actionBadge && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{m.actionBadge}</span>
                      </motion.div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-white/[0.08] text-slate-200 border border-white/[0.1] flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit text-xs text-purple-300"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Thinking across personal context...</span>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Prompt Bar (Matching Mockup Screen 2) */}
      <div className="mt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/[0.08] bg-[#0f0b1a]/95 backdrop-blur-2xl shadow-2xl"
        >
          {/* Glowing central mic trigger */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={toggleMic}
            className={`p-3 rounded-xl transition-all shadow-lg ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40' 
                : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-purple-600/30'
            }`}
            title="Speech Input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>

          <input
            type="text"
            placeholder={isListening ? "Listening to your voice..." : "Ask WristOS anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent px-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            className="p-3 rounded-xl bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all font-bold"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>

    </div>
  )
}
