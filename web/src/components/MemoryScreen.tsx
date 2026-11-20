import { useState } from 'react'
import { db, MemoryRecord } from '../lib/db'
import { memoryRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy,
  Check,
  Brain,
  Edit2,
  X,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function MemoryScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMemory, setEditingMemory] = useState<MemoryRecord | null>(null)
  const [newTag, setNewTag] = useState('Personal')
  const [newFact, setNewFact] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const memories = useLiveQuery(() => {
    const active = db.memories.filter((m) => !m.deletedAt)
    if (!searchQuery.trim()) {
      return active.reverse().sortBy('createdAt')
    }
    const q = searchQuery.toLowerCase().trim()
    return active
      .filter((m) => m.fact.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q))
      .reverse()
      .sortBy('createdAt')
  }, [searchQuery]) || []

  const handleDelete = async (id: string) => {
    await memoryRepository.delete(id)
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFact.trim()) return

    if (editingMemory) {
      await memoryRepository.update(editingMemory.id, newTag.trim() || 'General', newFact.trim())
      setEditingMemory(null)
    } else {
      await memoryRepository.add(newTag.trim() || 'General', newFact.trim())
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

  const predefinedTags = ['All', 'Health', 'Hardware', 'Preferences', 'Work', 'Routines']

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-pink-400" />
              <span>KNOWLEDGE VAULT • OFFLINE INDEXEDDB</span>
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            <span>Personal Memory</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {memories.length} facts
            </span>
          </h2>
          <p className="text-xs text-purple-200/80 font-medium max-w-lg">
            Grounding context used by Gemini AI to personalize assistance. Preserved offline in Dexie with encrypted cloud synchronization.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          onClick={() => {
            setEditingMemory(null)
            setNewFact('')
            setNewTag('Personal')
            setShowAddModal(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-xs transition-all shadow-lg shadow-pink-500/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Store Fact</span>
        </motion.button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search knowledge vault by keyword or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#140e29]/80 border border-purple-500/25 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-purple-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Tag Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {predefinedTags.map((tag) => {
            const isSelected = tag === 'All' ? searchQuery === '' : searchQuery.toLowerCase() === tag.toLowerCase()
            return (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag === 'All' ? '' : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'bg-[#140e29] text-purple-300 hover:text-white border border-purple-500/25'
                }`}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {memories.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-2xl bg-[#140e29]/80 hover:bg-[#1c133a] border border-purple-500/20 hover:border-purple-500/50 backdrop-blur-md shadow-sm hover:shadow-[0_4px_25px_rgba(168,85,247,0.2)] flex flex-col justify-between space-y-3 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    #{m.tag}
                  </span>
                  <span className="text-[10px] font-mono text-purple-300/60">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
                  {m.fact}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-purple-500/15">
                <button
                  onClick={() => handleCopy(m.id, m.fact)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-white transition-colors"
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(m)}
                    className="p-1 rounded-lg text-purple-400 hover:text-white transition-colors"
                    title="Edit fact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete fact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add / Edit Fact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345] to-[#0c071d] p-6 shadow-2xl shadow-purple-950/60 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>{editingMemory ? 'Edit Memory Fact' : 'Store New Fact in Vault'}</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Category Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="Personal, Health, Hardware, Work..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Fact or Context</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. My resting heart rate is usually 68 BPM and I prefer short 25m Pomodoros."
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30"
                  >
                    {editingMemory ? 'Update Fact' : 'Save Fact'}
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
