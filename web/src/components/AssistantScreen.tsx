import { useState, useRef, useEffect } from 'react'
import { db, TaskRecord, MemoryRecord } from '../lib/db'
import { taskRepository, memoryRepository } from '../lib/repository'
import { queryAssistant } from '../lib/assistantService'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Zap, 
  Bot, 
  User 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Message {
  id: string
  role: 'assistant' | 'user'
  text: string
  actionBadge?: string
  timestamp: number
}

export function AssistantScreen() {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const tasks = useLiveQuery(() => db.tasks.filter(t => !t.deletedAt).toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.filter(m => !m.deletedAt).toArray(), []) || []

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-0',
      role: 'assistant',
      text: "WristOS Intelligence online. Speak or write natural instructions to plan tasks, capture knowledge, or control your watch.",
      timestamp: Date.now()
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const speak = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
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

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

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
        actionBadge = `Watch Alert Dispatched (0x1811 ANS)`
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: parsedReply.cleanText,
        actionBadge,
        timestamp: Date.now()
      }

      setMessages((prev) => [...prev, aiMessage])
      speak(parsedReply.cleanText)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-7rem)]">
      
      {/* Top Status Bar */}
      <div className="flex items-center justify-between p-3.5 mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-white/[0.08] flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Gemini 1.5 Flash</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {memories.length} FACTS • {tasks.filter(t => !t.isCompleted).length} TASKS IN CONTEXT
            </div>
          </div>
        </div>

        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            ttsEnabled ? 'bg-white/[0.06] text-cyan-400 border border-white/[0.08]' : 'bg-transparent text-slate-500 hover:text-slate-300'
          }`}
          title="Speech Synthesis"
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-xl ${m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="space-y-1.5">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-sm shadow-sm'
                      : 'bg-[#12151e]/80 border border-white/[0.06] text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {m.text}
                </div>

                {m.actionBadge && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium">
                    <Zap className="w-3 h-3" />
                    <span>{m.actionBadge}</span>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Reasoning across personal context...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Prompt Bar */}
      <div className="mt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/[0.08] bg-[#11141c]/90 backdrop-blur-2xl shadow-xl"
        >
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Message assistant or command: 'Schedule task...', 'Remember that...'"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
