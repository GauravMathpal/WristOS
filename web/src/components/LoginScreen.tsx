import { useState } from 'react'
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
  Users
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
    connectWatch 
  } = useAppStore()

  const [authMode, setAuthMode] = useState<'switch' | 'signin' | 'signup' | 'pair'>('switch')
  
  // Sign in form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInError, setSignInError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sign up form state
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpRole, setSignUpRole] = useState('WatchOS Enthusiast')
  const [signUpStepGoal, setSignUpStepGoal] = useState(10000)
  const [signUpError, setSignUpError] = useState<string | null>(null)

  // BLE Scan state
  const [isScanning, setIsScanning] = useState(false)
  const isConnected = watch.connectionState === 'connected'

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
      // Find matching user or fallback to first
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
    }, 600)
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
    }, 600)
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
    <div className="min-h-screen bg-[#070510] text-[#f8fafc] font-sans antialiased selection:bg-purple-500/30 selection:text-white relative flex flex-col justify-between p-4 sm:p-8 overflow-hidden">

      {/* Atmospheric Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute top-[-10%] left-[20%] w-[650px] h-[650px] rounded-full pointer-events-none opacity-25 blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[20%] w-[650px] h-[650px] rounded-full pointer-events-none opacity-20 blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => setViewMode('landing')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px] shadow-md shadow-purple-500/30">
            <div className="w-full h-full bg-[#0d0918] rounded-[10px] flex items-center justify-center font-bold text-xs text-white">
              W
            </div>
          </div>
          <span className="font-bold text-sm text-white">WristOS Accounts</span>
        </div>
      </header>

      {/* Central Luxury Auth Card */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6 sm:p-8 rounded-3xl bg-[#110c22]/90 border border-white/[0.09] shadow-2xl backdrop-blur-2xl space-y-6"
        >
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {authMode === 'switch' && 'Select Your Account'}
              {authMode === 'signin' && 'Sign In to WristOS'}
              {authMode === 'signup' && 'Create Your Profile'}
              {authMode === 'pair' && 'Pair Your Smartwatch'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {authMode === 'switch' && 'Each user has a personalized profile, custom health goals, and AI memory.'}
              {authMode === 'signin' && 'Enter your email to load your personalized dashboard.'}
              {authMode === 'signup' && 'Set up your own dedicated profile and sync with WatchOS.'}
              {authMode === 'pair' && 'Link physical Bluetooth hardware directly to your user account.'}
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="grid grid-cols-4 p-1 rounded-2xl bg-[#090614] border border-white/[0.06] text-xs font-semibold">
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
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    active 
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* 1. QUICK USER SELECT (PROFILES) */}
          {authMode === 'switch' && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80 px-1">
                Saved User Accounts
              </p>
              
              <div className="space-y-2.5">
                {allUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    whileHover={{ scale: 1.015, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickLogin(u)}
                    className="p-3.5 rounded-2xl bg-[#16102c]/70 hover:bg-purple-900/30 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${u.avatarColor} p-0.5 shrink-0 shadow-md`}>
                        <div className="w-full h-full rounded-[14px] bg-[#0c0819] flex items-center justify-center font-bold text-sm text-white">
                          {u.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white group-hover:text-pink-200 transition-colors">
                            {u.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                        <p className="text-[10px] text-purple-300/80 font-mono">Goal: {u.dailyStepGoal.toLocaleString()} steps</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-purple-300 group-hover:text-white transition-colors">
                      <span>Log In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setAuthMode('signup')}
                  className="text-xs text-pink-400 hover:text-pink-300 font-bold transition-colors"
                >
                  + Create New User Account
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
                  <span className="text-[10px] text-purple-400 font-medium cursor-pointer">Optional for Demo</span>
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
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
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

              <div className="grid grid-cols-2 gap-3">
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
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 mx-auto flex items-center justify-center text-cyan-400">
                <Bluetooth className={`w-8 h-8 ${isScanning ? 'animate-bounce' : ''}`} />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {isConnected ? 'WatchOS Smartwatch Linked!' : 'Scan for WatchOS Hardware'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isConnected 
                    ? `Connected to ${watch.deviceName} with ${watch.batteryLevel}% battery.` 
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
      <footer className="relative z-10 text-center text-xs text-slate-500">
        <p>WristOS Ambient Ecosystem • Individual Profiles & Privacy Protected</p>
      </footer>

    </div>
  )
}
