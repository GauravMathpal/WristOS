import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Mail, 
  ShieldCheck, 
  Watch, 
  Award, 
  Flame, 
  Heart, 
  Footprints, 
  Bell, 
  Edit3, 
  LogOut, 
  Check, 
  ArrowRight, 
  Users, 
  UserPlus, 
  ChevronLeft
} from 'lucide-react'
import { useAppStore, DEFAULT_USERS } from '../stores/useAppStore'

export function ProfileScreen() {
  const { 
    currentUser, 
    allUsers, 
    switchUser, 
    updateCurrentUser, 
    logoutUser, 
    setActiveTab, 
    setViewMode,
    watch, 
    sendWatchAlert
  } = useAppStore()

  // Safe fallback to first profile if viewing profile settings
  const current = currentUser || DEFAULT_USERS[0]

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(current.name)
  const [editEmail, setEditEmail] = useState(current.email)
  const [editRole, setEditRole] = useState(current.role)
  const [editBio, setEditBio] = useState(current.bio || '')
  const [editStepGoal, setEditStepGoal] = useState(current.dailyStepGoal)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isConnected = watch.connectionState === 'connected'
  const displaySteps = watch.stepCount ?? 0
  const stepProgress = Math.min(100, Math.round((displaySteps / (current.dailyStepGoal || 10000)) * 100))

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateCurrentUser({
      name: editName.trim() || current.name,
      email: editEmail.trim() || current.email,
      role: editRole.trim() || current.role,
      bio: editBio.trim() || current.bio,
      dailyStepGoal: Number(editStepGoal) || current.dailyStepGoal
    })
    setIsEditing(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#140e29]/70 hover:bg-[#1e153e] border border-purple-500/20 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md"
        >
          <ChevronLeft className="w-4 h-4 text-purple-400" />
          <span>Back to Home</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={logoutUser}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold shadow-lg"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile settings updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Profile Banner Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#110c22] border border-white/[0.08] shadow-2xl p-6 sm:p-8"
      >
        {/* Ambient Gradient Backdrop */}
        <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r ${current.avatarColor} opacity-30 blur-2xl pointer-events-none`} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Big User Avatar Orb */}
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr ${current.avatarColor} p-1 shadow-2xl ring-2 ring-white/20 shrink-0`}>
              <div className="w-full h-full rounded-[22px] bg-[#0c0819] flex items-center justify-center text-3xl font-black text-white font-mono shadow-inner">
                {current.name.charAt(0)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {current.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Verified User</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-300/80 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{current.email}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {current.role}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-start sm:self-center bg-[#17102e]/80 border border-purple-500/20 px-4 py-2.5 rounded-2xl shadow-inner">
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-medium">Daily Goal</p>
              <p className="text-sm font-black text-white font-mono">{current.dailyStepGoal.toLocaleString()}</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-medium">Watch Link</p>
              <p className={`text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {current.bio && (
          <p className="relative z-10 text-xs text-slate-300/90 leading-relaxed mt-4 pt-4 border-t border-white/[0.06]">
            "{current.bio}"
          </p>
        )}
      </motion.div>

      {/* Edit Profile Form (Collapsible) */}
      <AnimatePresence>
        {isEditing && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveProfile}
            className="p-6 rounded-3xl bg-[#140e29] border border-purple-500/30 shadow-xl space-y-4 overflow-hidden"
          >
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>Edit Account Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c081a] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c081a] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Role / Headline</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c081a] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Daily Step Goal</label>
                <input
                  type="number"
                  value={editStepGoal}
                  onChange={(e) => setEditStepGoal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c081a] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  step="500"
                  min="2000"
                  max="50000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 font-semibold mb-1 block">Personal Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c081a] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Short personal summary..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Two Column Section: Personal Biometrics vs Linked Watch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Personal Target Metrics */}
        <div className="p-6 rounded-3xl bg-[#140e29]/90 border border-white/[0.08] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-pink-400" />
              <span>Personal Fitness Targets</span>
            </h3>
            <span className="text-[11px] font-mono text-purple-300">{stepProgress}% Goal Met</span>
          </div>

          {/* Step Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                <span>Today's Steps</span>
              </span>
              <span className="text-white font-mono font-bold">
                {displaySteps.toLocaleString()} / {current.dailyStepGoal.toLocaleString()}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#0e0a1f] border border-white/[0.05] space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <Heart className="w-3.5 h-3.5" />
                <span>Resting BPM</span>
              </div>
              <p className="text-lg font-black text-white font-mono">
                {watch.heartRate > 0 ? watch.heartRate : current.targetHeartRate} <span className="text-xs text-slate-400 font-normal">bpm</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0e0a1f] border border-white/[0.05] space-y-1">
              <div className="flex items-center gap-1.5 text-orange-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>Target Burn</span>
              </div>
              <p className="text-lg font-black text-white font-mono">
                {Math.round(displaySteps * 0.04)} <span className="text-xs text-slate-400 font-normal">kcal</span>
              </p>
            </div>
          </div>
        </div>

        {/* Linked Watch Hardware */}
        <div className="p-6 rounded-3xl bg-[#140e29]/90 border border-white/[0.08] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Watch className="w-4 h-4 text-cyan-400" />
              <span>Paired Hardware</span>
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
              {isConnected ? 'Live Link Active' : 'Disconnected'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e0a1f] border border-white/[0.05] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-white">{current.pairedWatchName}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                Nordic nRF52832 • InfiniTime 1.16.0
              </p>
              <p className="text-[10px] text-purple-300">
                Battery: {watch.batteryLevel > 0 ? watch.batteryLevel : 91}%
              </p>
            </div>

            <button
              onClick={() => {
                sendWatchAlert(`Ping from ${current.name}`)
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Haptic Ping</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Need to change watch pairing?</span>
            <button
              onClick={() => setActiveTab('devices')}
              className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Manage Devices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Multi-User Switcher Carousel */}
      <div className="p-6 rounded-3xl bg-[#140e29]/90 border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Project Team Profiles</span>
            </h3>
            <p className="text-xs text-slate-400">
              WristOS core engineering, firmware, and product team accounts. Each profile maintains personalized watch telemetry and biometrics.
            </p>
          </div>

          <button
            onClick={() => setViewMode('login')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-slate-300 hover:text-white border border-white/10 transition-all self-start sm:self-auto shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add / Register User</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
          {allUsers.map((u) => {
            const isCurrent = currentUser ? u.id === currentUser.id : false
            const isGroup1 = u.role.includes('Group 1')
            const isGroup2 = u.role.includes('Group 2')
            const isGroup3 = u.role.includes('Group 3')

            return (
              <motion.div
                key={u.id}
                whileHover={{ y: -3 }}
                onClick={() => switchUser(u.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isCurrent 
                    ? 'bg-gradient-to-b from-purple-900/40 via-[#1a1236] to-[#120c26] border-purple-400/60 shadow-xl shadow-purple-950/60 ring-1 ring-purple-400/30' 
                    : 'bg-[#0d091e] border-white/[0.06] hover:border-purple-500/30 hover:bg-[#140e2b]'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono shadow-md">
                    ACTIVE
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${u.avatarColor} p-0.5 shrink-0 shadow-md`}>
                      <div className="w-full h-full rounded-[14px] bg-[#0c0819] flex items-center justify-center font-bold text-sm text-white">
                        {u.name.charAt(0)}
                      </div>
                    </div>

                    <div className="overflow-hidden pr-12">
                      <p className="text-sm font-extrabold text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-purple-300/70 truncate font-mono">{u.email}</p>
                    </div>
                  </div>

                  {/* Group Pill Tag */}
                  <div>
                    <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isGroup1 ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                      isGroup2 ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
                      isGroup3 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      'bg-slate-500/15 text-slate-300 border-slate-500/30'
                    }`}>
                      {isGroup1 ? 'Group 1: AI & App' : isGroup2 ? 'Group 2: Watch & Firmware' : isGroup3 ? 'Group 3: Product & QA' : 'Team Member'}
                    </span>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-tight">
                      {u.role.replace(/ \(Group \d:.*?\)/, '')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-3 border-t border-white/[0.06]">
                  <span className="font-mono text-slate-300 font-medium">Goal: {u.dailyStepGoal.toLocaleString()} st</span>
                  <span className={`font-bold ${isCurrent ? 'text-pink-300' : 'text-purple-400 hover:text-purple-300'}`}>
                    {isCurrent ? 'Viewing Profile' : 'Switch Persona →'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
