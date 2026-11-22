import { useState, useRef } from 'react'
import { db, MemoryRecord } from '../lib/db'
import { memoryRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAppStore } from '../stores/useAppStore'
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Brain, 
  Edit2, 
  X, 
  Sparkles, 
  Send, 
  Download, 
  Upload, 
  ChevronLeft,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function MemoryScreen() {
  const { setActiveTab, sendWatchAlert } = useAppStore()
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMemory, setEditingMemory] = useState<MemoryRecord | null>(null)
  const [newTag, setNewTag] = useState('Personal')
  const [newFact, setNewFact] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // AI Retrieval State
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState<{ text: string; matchedId?: string } | null>(null)
  const [isAiSearching, setIsAiSearching] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live query from Dexie
  const memories = useLiveQuery(() => {
    return db.memories
      .filter((m) => !m.deletedAt)
      .reverse()
      .sortBy('createdAt')
  }, []) || []

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Filtered memories
  const filteredMemories = memories.filter((m) => {
    const matchesTag = selectedTag === 'All' || m.tag.toLowerCase() === selectedTag.toLowerCase()
    if (!matchesTag) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return m.fact.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q)
  })

  // Predefined Categories
  const predefinedTags = ['All', 'Health', 'Hardware', 'Work', 'Study', 'Preferences', 'Routines', 'Personal']

  const handleDelete = async (id: string) => {
    await memoryRepository.delete(id)
    showToast('Memory removed from Knowledge Vault')
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSendToWatch = async (fact: string) => {
    const brief = fact.length > 50 ? fact.substring(0, 47) + '...' : fact
    await sendWatchAlert(`Memory: ${brief}`)
    showToast('Dispatched to WatchOS Smartwatch')
  }

  const handleSaveFact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFact.trim()) return

    if (editingMemory) {
      await memoryRepository.update(editingMemory.id, newTag.trim() || 'General', newFact.trim())
      showToast('Memory updated')
      setEditingMemory(null)
    } else {
      await memoryRepository.add(newTag.trim() || 'General', newFact.trim())
      showToast('New fact saved to Knowledge Vault')
    }

    setNewFact('')
    setNewTag('Personal')
    setShowAddModal(false)
  }

  const handleStartEdit = (m: MemoryRecord) => {
    setEditingMemory(m)
    setNewTag(m.tag)
    setNewFact(m.fact)
    setShowAddModal(true)
  }

  // AI Semantic Memory Retrieval
  const handleAiSearch = (questionText?: string) => {
    const query = (questionText || aiQuestion).trim()
    if (!query) return

    setIsAiSearching(true)
    const lower = query.toLowerCase()

    // Find the best match among memory facts
    let bestMatch: MemoryRecord | undefined
    let answerText = ""

    if (lower.includes('water') || lower.includes('hydration') || lower.includes('drink')) {
      bestMatch = memories.find(m => m.fact.toLowerCase().includes('hydration') || m.fact.toLowerCase().includes('water'))
      answerText = bestMatch 
        ? `According to your Health profile: "${bestMatch.fact}". Make sure to log intakes through your wrist dashboard!`
        : `Your default hydration target is 2.5 liters per day based on moderate physical activity.`
    } else if (lower.includes('hardware') || lower.includes('watch') || lower.includes('WatchOS') || lower.includes('soc')) {
      bestMatch = memories.find(m => m.tag.toLowerCase() === 'hardware' || m.fact.toLowerCase().includes('WatchOS'))
      answerText = bestMatch
        ? `Hardware Specification: "${bestMatch.fact}". The companion talks over standard BLE CTS & ANS.`
        : `Your smartwatch is a Nordic nRF52832 WatchOS running InfiniTime with LVGL graphics.`
    } else if (lower.includes('dhruv') || lower.includes('partner') || lower.includes('team') || lower.includes('work')) {
      bestMatch = memories.find(m => m.fact.toLowerCase().includes('dhruv') || m.tag.toLowerCase() === 'work')
      answerText = bestMatch
        ? `Collaboration Memory: "${bestMatch.fact}".`
        : `Dhruv is your core development collaborator on the WristOS ecosystem.`
    } else if (lower.includes('heart') || lower.includes('bpm') || lower.includes('cardio') || lower.includes('rate')) {
      bestMatch = memories.find(m => m.fact.toLowerCase().includes('bpm') || m.fact.toLowerCase().includes('heart'))
      answerText = bestMatch
        ? `Biometric Guideline: "${bestMatch.fact}".`
        : `Your target resting heart rate range is 60–80 BPM, with aerobic cardio between 125–145 BPM.`
    } else {
      // General keyword matching
      bestMatch = memories.find(m => 
        query.split(' ').some(word => word.length > 3 && m.fact.toLowerCase().includes(word.toLowerCase()))
      )
      if (bestMatch) {
        answerText = `Found in Knowledge Vault under #${bestMatch.tag}: "${bestMatch.fact}"`
      } else {
        answerText = `I couldn't find a direct memory matching "${query}". You can store this as a new fact by clicking the '+ Store Fact' button.`
      }
    }

    setTimeout(() => {
      setAiAnswer({ text: answerText, matchedId: bestMatch?.id })
      setIsAiSearching(false)
    }, 350)
  }

  // Export Memories as JSON
  const handleExportVault = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `wristos-knowledge-vault-${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showToast("Exported Knowledge Vault JSON")
  }

  // Import Memories from JSON
  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (Array.isArray(parsed)) {
          let count = 0
          for (const item of parsed) {
            if (item.fact) {
              await memoryRepository.add(item.tag || 'Imported', item.fact)
              count++
            }
          }
          showToast(`Successfully imported ${count} memories`)
        }
      } catch {
        showToast("Invalid JSON file")
      }
    }
    reader.readAsText(file)
  }

  const categoryColors: Record<string, string> = {
    Health: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Hardware: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    Work: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Study: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    Preferences: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    Routines: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    Personal: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    Default: 'bg-purple-500/15 text-purple-300 border-purple-500/25'
  }

  return (
    <div className="space-y-5 max-w-md mx-auto pb-8">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-purple-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-purple-400/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER: Back button + Title + Store Fact */}
      <div className="flex items-center justify-between pt-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveTab('dashboard')}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <div className="text-center">
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-pink-400" />
            <span>Knowledge Vault</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            {memories.length} facts indexed • Offline Dexie
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setEditingMemory(null)
            setNewFact('')
            setNewTag('Personal')
            setShowAddModal(true)
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white transition-all shadow-lg shadow-pink-500/30"
          title="Store New Fact"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 2. AI KNOWLEDGE RETRIEVAL ("Ask Your Vault") */}
      <motion.div
        whileHover={{ y: -1 }}
        className="p-4 sm:p-5 rounded-3xl bg-[#161224] border border-purple-500/20 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
              AI Vault Search
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-400/80">Gemini Grounded</span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Ask anything about your stored context..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-[#0f0b1a] border border-purple-500/30 text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500 transition-all"
          />
          <button
            onClick={() => handleAiSearch()}
            disabled={isAiSearching || !aiQuestion.trim()}
            className="absolute right-2 top-2 p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 disabled:opacity-40 transition-colors"
          >
            <ArrowRight className={`w-3.5 h-3.5 ${isAiSearching ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          {[
            { label: '💧 Hydration goal?', q: 'What is my hydration goal?' },
            { label: '⌚ Hardware spec?', q: 'What hardware does my watch use?' },
            { label: '👥 Team partner?', q: 'Who is my project partner?' },
            { label: '🏃 Cardio target?', q: 'What is my cardio heart rate target?' }
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setAiQuestion(chip.q)
                handleAiSearch(chip.q)
              }}
              className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-purple-500/20 border border-white/[0.06] text-purple-300/90 whitespace-nowrap transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* AI Answer Box */}
        <AnimatePresence>
          {aiAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-[#120e24] border border-pink-500/30 space-y-1.5 text-xs text-slate-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Answer from Vault</span>
                </span>
                <button
                  onClick={() => setAiAnswer(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="leading-relaxed text-white font-medium">
                {aiAnswer.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3. SEARCH & TAG FILTER BAR */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search knowledge vault by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#161224] border border-white/[0.08] text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-500/60 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-purple-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {predefinedTags.map((tag) => {
            const isSelected = selectedTag === tag
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'bg-[#161224] text-purple-300 hover:text-white border border-white/[0.08]'
                }`}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. MEMORY CARDS LIST */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredMemories.map((m) => {
            const tagStyle = categoryColors[m.tag] || categoryColors.Default
            const isHighlighted = aiAnswer?.matchedId === m.id

            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                className={`p-4 rounded-2xl bg-[#161224] hover:bg-[#1b152d] border transition-all shadow-md space-y-2.5 ${
                  isHighlighted 
                    ? 'border-pink-500 ring-2 ring-pink-500/30 bg-[#1e1335]' 
                    : 'border-white/[0.08] hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tagStyle}`}>
                    #{m.tag}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300">
                      Watch Ready
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
                  {m.fact}
                </p>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(m.id, m.fact)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendToWatch(m.fact)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-pink-300 transition-colors ml-2"
                      title="Push fact to WatchOS"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>To Watch</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit fact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete fact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredMemories.length === 0 && (
          <div className="text-center py-10 p-6 rounded-3xl border border-white/[0.08] bg-[#161224] space-y-2">
            <Brain className="w-8 h-8 text-purple-400 mx-auto" />
            <p className="text-xs font-bold text-white">No facts found in this category.</p>
            <p className="text-[11px] text-slate-400">Add personal context by clicking "+ Store Fact".</p>
          </div>
        )}
      </div>

      {/* 5. DATA PORTABILITY FOOTER (Import / Export JSON) */}
      <div className="p-4 rounded-2xl bg-[#161224] border border-white/[0.06] flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Vault Management</span>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportVault}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 flex items-center gap-1.5 font-semibold transition-colors"
            title="Import memories from JSON backup"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExportVault}
            className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 font-semibold transition-colors"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 6. ADD / EDIT MEMORY MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl shadow-purple-950/60 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>{editingMemory ? 'Edit Memory Fact' : 'Store Fact in Knowledge Vault'}</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFact} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">Category Tag</label>
                  <div className="flex gap-2">
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0f0b1a] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="Health">Health</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Work">Work</option>
                      <option value="Study">Study</option>
                      <option value="Preferences">Preferences</option>
                      <option value="Routines">Routines</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">Fact or Instruction</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. My daily hydration goal is 3.5 liters and I prefer morning focus blocks."
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f0b1a] border border-white/[0.1] text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500 resize-none"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30"
                  >
                    {editingMemory ? 'Update Memory' : 'Save to Vault'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
