import { useState, useRef, useEffect } from 'react'
import { db } from '../lib/db'
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

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.toArray(), []) || []

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-0',
      role: 'assistant',
      text: "Greetings Gaurav! WristOS Intelligence is active. Ask me anything, command tasks, or dictate new memories.",
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

    // Simulated Smart Action parsing (will connect directly to Supabase Gemini Edge Function in M4/M5)
    setTimeout(async () => {
      const lower = textToSend.toLowerCase()
      let replyText = "I have noted that and updated your personal context."
      let actionBadge: string | undefined = undefined

      if (lower.includes('task') || lower.includes('remind') || lower.includes('agenda')) {
        const title = textToSend.replace(/(remind me to|create a task to|add task)/i, '').trim() || textToSend
        await db.tasks.add({
          id: `task-${Date.now()}`,
          title: title.charAt(0).toUpperCase() + title.slice(1),
          dueTime: 'Today',
          isCompleted: false,
          createdAt: Date.now()
        })
        replyText = `Task added to your agenda: "${title}".`
        actionBadge = `Created Task: "${title}"`
      } else if (lower.includes('remember') || lower.includes('save fact')) {
        const fact = textToSend.replace(/(remember that|save fact)/i, '').trim() || textToSend
        await db.memories.add({
          id: `mem-${Date.now()}`,
          tag: 'Personal',
          fact: fact.charAt(0).toUpperCase() + fact.slice(1),
          createdAt: Date.now()
        })
        replyText = `Stored in your Knowledge Vault: "${fact}".`
        actionBadge = `Saved Memory in Vault`
      } else if (lower.includes('vibrate') || lower.includes('alert watch')) {
        replyText = `Dispatched haptic alert vibration to your PineTime smartwatch.`
        actionBadge = `Watch Alert BLE 0x1811 Sent`
      } else {
        replyText = `You have ${tasks.filter(t => !t.isCompleted).length} pending tasks today and ${memories.length} facts in your Vault. PineTime telemetry is streaming steadily.`
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        actionBadge,
        timestamp: Date.now()
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
      speak(replyText)
    }, 700)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] md:h-[calc(100vh-8rem)]">
      {/* Top AI Controls */}
      <div className="flex items-center justify-between p-4 mb-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>WristOS Gemini AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] text-slate-400">{memories.length} facts injected in prompt</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              ttsEnabled ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'
            }`}
            title="Speech Synthesis"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="space-y-1.5">
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-sm shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {m.text}
                </div>

                {m.actionBadge && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
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
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 w-fit text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>WristOS is reasoning...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-3 relative">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Listening to voice input..." : "Ask AI or command: 'Remind me to...', 'Remember that...'"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent px-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
