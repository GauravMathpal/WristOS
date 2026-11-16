import { useState } from 'react'
import { db, MemoryRecord } from '../lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  BrainCircuit, 
  Search, 
  Plus, 
  Trash2, 
  Tag, 
  Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function MemoryScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTag, setNewTag] = useState('Personal')
  const [newFact, setNewFact] = useState('')

  const memories = useLiveQuery(() => {
    if (!searchQuery.trim()) {
      return db.memories.orderBy('createdAt').reverse().toArray()
    }
    const q = searchQuery.toLowerCase().trim()
    return db.memories
      .filter((m) => m.fact.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q))
      .toArray()
  }, [searchQuery]) || []

  const handleDelete = async (id: string) => {
    await db.memories.delete(id)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFact.trim()) return

    const newMemory: MemoryRecord = {
      id: `mem-${Date.now()}`,
      tag: newTag.trim() || 'General',
      fact: newFact.trim(),
      createdAt: Date.now()
    }

    await db.memories.add(newMemory)
    setNewFact('')
    setNewTag('Personal')
    setShowAddModal(false)
  }

  const predefinedTags = ['Health', 'Hardware', 'Preferences', 'Work', 'Routines']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Knowledge Vault</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Personal Intelligence Memory</h2>
          <p className="text-xs text-slate-400">
            {memories.length} facts preserved locally in Dexie IndexedDB & ready for Gemini prompt context
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Remember Fact</span>
        </button>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search across facts, keywords, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Tags:</span>
          {predefinedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                searchQuery === tag 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence initial={false}>
          {memories.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-md flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Tag className="w-3 h-3" />
                    <span>{m.tag}</span>
                  </span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {m.fact}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="text-indigo-400/80 font-medium">Dexie Verified</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {memories.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-slate-800 text-slate-500 text-sm space-y-2">
            <BrainCircuit className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Vault query empty</p>
            <p className="text-xs text-slate-500">No memory matches "{searchQuery}". Click "Remember Fact" to add one.</p>
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Store Knowledge Fact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Category Tag</label>
                <input
                  type="text"
                  placeholder="e.g., Health, Work, Sleep, Preferences"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Fact Description</label>
                <textarea
                  rows={3}
                  placeholder="What should WristOS remember about you?"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20"
                >
                  Store in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
