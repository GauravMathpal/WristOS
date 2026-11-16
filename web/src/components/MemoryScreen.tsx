import { useState } from 'react'
import { db, MemoryRecord } from '../lib/db'
import { memoryRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Search, 
  Plus, 
  Trash2, 
  Tag, 
  Calendar,
  CloudCheck,
  CloudUpload,
  Copy,
  Check,
  Brain,
  Sparkles,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function MemoryScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
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

    await memoryRepository.add(newTag.trim() || 'General', newFact.trim())
    setNewFact('')
    setNewTag('Personal')
    setShowAddModal(false)
  }

  const predefinedTags = ['All', 'Health', 'Hardware', 'Preferences', 'Work', 'Routines']

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 md:p-7 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium text-[11px]">Knowledge Vault • Offline IndexedDB</span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Personal Memory</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                {memories.length} facts
              </span>
            </h2>

            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Grounding context used by Gemini AI to personalize assistance. Preserved offline in Dexie with encrypted cloud synchronization.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Store Fact</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search knowledge vault by keyword or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-white/[0.12] text-white border-white/20'
                    : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border-white/[0.05]'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <AnimatePresence initial={false}>
          {memories.map((m: MemoryRecord) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.1] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span>{m.tag}</span>
                  </span>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(m.id, m.fact)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
                      title="Copy fact"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete fact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {m.fact}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>{new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  {m.syncStatus === 'synced' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                      <CloudCheck className="w-3 h-3" />
                      <span>Synced</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 font-mono">
                      <CloudUpload className="w-3 h-3" />
                      <span>Local</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {memories.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
              <Brain className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">No memories found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery ? `No memory matches "${searchQuery}".` : 'Store facts or let the assistant extract knowledge from your conversations.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Store your first fact</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-2xl bg-[#0e131f] border border-white/[0.1] shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Store Knowledge Fact</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Category Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Health, Work, Sleep, Preferences"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Fact Description</label>
                <textarea
                  rows={3}
                  placeholder="What should WristOS remember about you?"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/20 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFact.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-40 transition-all"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
