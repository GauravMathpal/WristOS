import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { 
  Bluetooth, 
  Mail, 
  ArrowLeft, 
  Lock, 
  RefreshCw,
  ArrowRight, 
  User, 
  UserPlus, 
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  Watch,
  Zap
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { UserProfile } from '../types'

export function LoginScreen() {
  const { 
    setViewMode, 
    setActiveTab, 
    allUsers, 
    loginUser, 
    registerUser, 
    watch, 
    connectWatch,
    currentUser,
    logoutUser
  } = useAppStore()

  const [authMode, setAuthMode] = useState<'switch' | 'signin' | 'signup' | 'pair'>('switch')
  
  // Search query for team profiles
  const [searchQuery, setSearchQuery] = useState('')

  // Sign in form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInError, setSignInError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sign up form state
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpRole, setSignUpRole] = useState('WristOS Member')
  const [signUpStepGoal, setSignUpStepGoal] = useState(10000)
  const [signUpError, setSignUpError] = useState<string | null>(null)

  // BLE Scan state
  const [isScanning, setIsScanning] = useState(false)
  const isConnected = watch.connectionState === 'connected'

  // Filtered team profiles
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers
    const q = searchQuery.toLowerCase().trim()
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.role.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    )
  }, [allUsers, searchQuery])

  const handleQuickLogin = (user: UserProfile) => {
    loginUser(user)
  }

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError(null)
    if (!email.trim()) {
      setSignInError('Please enter your email address.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      // Find matching user or fallback to new registration
      const found = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase())
      if (found) {
        loginUser(found)
      } else {
        // Auto-create profile for this email so login always works seamlessly
        const namePart = email.split('@')[0]
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
        const newUser = registerUser({
          name: formattedName,
          email: email.trim(),
          avatarColor: 'from-purple-600 via-indigo-600 to-pink-600',
          role: 'WristOS Member',
          dailyStepGoal: 10000,
          targetHeartRate: 72,
          pairedWatchName: 'WatchOS BLE Primary'
        })
        loginUser(newUser)
      }
      setIsSubmitting(false)
    }, 450)
  }

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError(null)
    if (!signUpName.trim() || !signUpEmail.trim()) {
      setSignUpError('Please provide your name and email.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      const newUser = registerUser({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        avatarColor: 'from-pink-500 via-rose-500 to-amber-500',
        role: signUpRole.trim() || 'WristOS Member',
        dailyStepGoal: Number(signUpStepGoal) || 10000,
        targetHeartRate: 72,
        pairedWatchName: 'WatchOS BLE Primary'
      })
      loginUser(newUser)
      setIsSubmitting(false)
    }, 450)
  }

  const handlePairWatch = async () => {
    setIsScanning(true)
    try {
      await connectWatch()
    } catch (err) {
      console.warn("BLE pairing cancelled or error:", err)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070510] text-[#f8fafc] font-sans antialiased selection:bg-purple-500/30 selection:text-white relative flex flex-col justify-between p-3 sm:p-6 md:p-8 overflow-y-auto w-full">

      {/* Atmospheric Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-25 blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between gap-3 pt-1 pb-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setViewMode('landing')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Back to Landing Page</span>
          <span className="sm:hidden">Portal</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px] shadow-md shadow-purple-500/30">
            <div className="w-full h-full bg-[#0d0918] rounded-[10px] flex items-center justify-center font-bold text-xs text-white">
              W
            </div>
          </div>
          <span className="font-bold text-xs sm:text-sm text-white tracking-tight">WristOS Portal</span>
        </div>
      </header>

      {/* Central Luxury Auth Card */}
      <main className="relative z-10 max-w-xl w-full mx-auto my-auto py-3 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28 }}
          className="p-4 sm:p-7 md:p-8 rounded-3xl bg-[#0f0a20]/90 border border-white/[0.09] shadow-2xl backdrop-blur-2xl space-y-4 sm:space-y-6"
        >
          {/* Card Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[11px] font-mono font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AUTHENTICATION & PROFILES</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {authMode === 'switch' && 'Select Your Team Profile'}
              {authMode === 'signin' && 'Sign In to WristOS'}
              {authMode === 'signup' && 'Create Your Profile'}
              {authMode === 'pair' && 'Pair Smartwatch Hardware'}
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {authMode === 'switch' && 'Each team member has dedicated biometric telemetry, smart habit goals, and encrypted memory storage.'}
              {authMode === 'signin' && 'Enter your email to load your personalized companion dashboard.'}
              {authMode === 'signup' && 'Register your name and profile to sync with WatchOS firmware.'}
              {authMode === 'pair' && 'Connect your physical PineTime / WristOS watch via Web Bluetooth.'}
            </p>
          </div>

          {/* Active Account Quick Continue Banner if already signed in */}
          {currentUser && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/30 to-pink-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor} p-0.5 shadow-md shrink-0`}>
                  <div className="w-full h-full rounded-[10px] bg-[#0c0819] flex items-center justify-center font-bold text-xs sm:text-sm text-white">
                    {currentUser.name.charAt(0)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <p className="text-xs sm:text-sm font-bold text-white truncate">Signed in as {currentUser.name}</p>
                  </div>
                  <p className="text-[10px] text-purple-300/80 font-mono truncate">{currentUser.email} • {currentUser.role.split(' ')[0]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => {
                    setViewMode('app')
                    setActiveTab('dashboard')
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logoutUser}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-white/10 text-xs transition-colors"
                  title="Switch profile"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Responsive Mode Switcher Pills */}
          <div className="grid grid-cols-4 p-1 rounded-2xl bg-[#090614] border border-white/[0.06] text-xs font-semibold gap-1">
            {[
              { id: 'switch' as const, label: 'Profiles', icon: Users },
              { id: 'signin' as const, label: 'Sign In', icon: Lock },
              { id: 'signup' as const, label: 'Register', icon: UserPlus },
              { id: 'pair' as const, label: 'Pair BLE', icon: Bluetooth }
            ].map(tab => {
              const active = authMode === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setAuthMode(tab.id)}
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    active 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-purple-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] sm:text-xs truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* 1. QUICK USER SELECT (PROFILES) */}
          {authMode === 'switch' && (
            <div className="space-y-3">
              {/* Search Bar & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
                  WristOS Team Accounts
                </p>
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter team..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#090615] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No matching team members found for "{searchQuery}".
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isGroup1 = u.role.includes('Group 1')
                    const isGroup2 = u.role.includes('Group 2')
                    const isGroup3 = u.role.includes('Group 3')
                    const isSelected = currentUser?.id === u.id

                    return (
                      <motion.div
                        key={u.id}
                        whileHover={{ scale: 1.012, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickLogin(u)}
                        className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all group ${
                          isSelected
                            ? 'bg-purple-900/40 border-purple-400 shadow-md shadow-purple-900/30'
                            : 'bg-[#140e2b]/70 hover:bg-purple-900/30 border-purple-500/20 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr ${u.avatarColor} p-0.5 shrink-0 shadow-md`}>
                            <div className="w-full h-full rounded-[14px] bg-[#0c0819] flex items-center justify-center font-bold text-xs sm:text-sm text-white">
                              {u.name.charAt(0)}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-pink-200 transition-colors truncate">
                                {u.name}
                              </h4>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                isGroup1 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                                isGroup2 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                                isGroup3 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                'bg-slate-500/20 text-slate-300 border-slate-500/40'
                              }`}>
                                {isGroup1 ? 'G1: AI/App' : isGroup2 ? 'G2: Firmware' : isGroup3 ? 'G3: QA/Docs' : 'Team'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{u.role.replace(/ \(Group \d:.*?\)/, '')}</p>
                            <p className="text-[10px] text-purple-300/80 font-mono truncate">{u.email} • {u.dailyStepGoal.toLocaleString()} steps</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-purple-300 group-hover:text-white transition-colors shrink-0 pl-2">
                          <span className="hidden sm:inline">Log In</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setAuthMode('signup')}
                  className="text-xs text-pink-400 hover:text-pink-300 font-bold transition-colors"
                >
                  + Create New Custom Profile
                </button>
              </div>
            </div>
          )}

          {/* 2. SIGN IN WITH EMAIL & PASSWORD */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              {signInError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {signInError}
                </div>
              )}

              {/* 1-Tap Demo Autofill Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-purple-300/80">Quick Autofill Demo Accounts</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Gaurav (Lead)', email: 'gaurav@wristos.com' },
                    { label: 'Dhruv (AI/App)', email: 'dhruv@wristos.com' },
                    { label: 'Daksh (Firmware)', email: 'daksh@wristos.com' },
                    { label: 'Atharv (Embedded)', email: 'atharv@wristos.com' }
                  ].map(p => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => setEmail(p.email)}
                      className="px-2.5 py-1 rounded-lg bg-[#140e29] hover:bg-purple-900/40 border border-purple-500/20 text-[11px] text-slate-300 hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. gaurav@wristos.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0715] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-300">Password</label>
                  <span className="text-[10px] text-purple-400 font-medium">Optional for Demo</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0715] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In & Open Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. REGISTER NEW USER PROFILE */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3 sm:space-y-3.5">
              {signUpError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {signUpError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0715] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. alex@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0715] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Role / Title</label>
                  <input
                    type="text"
                    value={signUpRole}
                    onChange={(e) => setSignUpRole(e.target.value)}
                    placeholder="e.g. Biohacker"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a0715] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Daily Step Goal</label>
                  <input
                    type="number"
                    value={signUpStepGoal}
                    onChange={(e) => setSignUpStepGoal(Number(e.target.value))}
                    step="500"
                    min="2000"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a0715] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create User Profile & Launch</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 4. BLUETOOTH PAIRING FIRST */}
          {authMode === 'pair' && (
            <div className="space-y-4 text-center">
              <div className="relative w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 mx-auto flex items-center justify-center text-cyan-400">
                <span className="absolute inset-0 rounded-3xl bg-cyan-500/10 animate-ping pointer-events-none" />
                <Bluetooth className={`w-9 h-9 ${isScanning ? 'animate-bounce' : ''}`} />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <Watch className="w-4 h-4 text-purple-400" />
                  <span>{isConnected ? 'WatchOS Smartwatch Linked!' : 'Scan for WatchOS Hardware'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isConnected 
                    ? `Connected to ${watch.deviceName} (${watch.batteryLevel}% battery).` 
                    : 'Turn on Bluetooth and keep your smartwatch awake.'}
                </p>
              </div>

              <button
                onClick={handlePairWatch}
                disabled={isScanning}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning BLE Devices...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    <span>{isConnected ? 'Re-scan / Re-link' : 'Search for Smartwatch'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('profile')
                }}
                className="text-xs text-purple-300 hover:text-white font-semibold transition-colors"
              >
                Skip to Profile →
              </button>
            </div>
          )}

        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 text-center text-[11px] sm:text-xs text-slate-500 py-2">
        <p>WristOS Ambient Ecosystem • Individual Profiles & Privacy Protected</p>
      </footer>

    </div>
  )
}
