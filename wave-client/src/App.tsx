
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Mood from './pages/Mood'
import Pulse from './pages/Pulse'
import Journal from './pages/Journal'
import Crisis from './pages/Crisis'
import Settings from './pages/Settings'
import Meditation from './pages/Meditation'
import AnimatedBackground from './components/AnimatedBackground'
import { useEffect, useState, useRef } from 'react'
import { useTheme } from './services/theme'
import { supabase, signInWithGoogle, signOut, getUser } from './services/supabaseClient'

function useDeviceId(){
  const [id, setId] = useState<string>('')
  useEffect(()=>{
    const cur = localStorage.getItem('wave-device-id')
    if (cur) setId(cur)
    else { const gen = crypto.randomUUID(); localStorage.setItem('wave-device-id', gen); setId(gen) }
  },[])
  return id
}

function useMusic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Use the existing videoplayback.m4a file for soothing background music
    audioRef.current = new Audio('/audio/videoplayback.m4a')
    audioRef.current.loop = true
    audioRef.current.volume = 0.5
    audioRef.current.preload = 'metadata'
    
    // Handle any loading errors gracefully
    audioRef.current.addEventListener('error', (e) => {
      console.log('Audio file loading error:', e)
      console.log('Make sure videoplayback.m4a is in the public/audio directory')
    })

    // Handle successful loading
    audioRef.current.addEventListener('loadeddata', () => {
      console.log('Soothing music loaded successfully')
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const toggleMusic = async () => {
    if (!audioRef.current) return
    
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        localStorage.setItem('wave-music-playing', 'false')
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        localStorage.setItem('wave-music-playing', 'true')
      }
    } catch (error) {
      console.log('Audio playback failed:', error)
      // For browsers that don't allow autoplay without user interaction
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('Please interact with the page first to enable audio')
      }
    }
  }

  // Restore music state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('wave-music-playing')
    if (savedState === 'true' && audioRef.current) {
      // Don't auto-play on load to respect browser policies
      // User needs to click the button to start music
      setIsPlaying(false)
    }
  }, [])

  return { isPlaying, toggleMusic }
}

const Headbar = ({ email, onGoogle, onSignOut, onSwitch, isPlaying, onToggleMusic }: any) => {
  const tabs = [
    ['/', '🏠', 'Home'], 
    ['/chat', '💬', 'Chat'],
    ['/meditation', '🧘‍♀️', 'Meditate'],
    ['/mood', '😊', 'Mood'], 
    ['/journal', '📝', 'Journal'],
    ['/pulse', '🤝', 'Pulse'], 
    ['/crisis', '🆘', 'Panic'], 
    ['/settings', '⚙️', 'Settings'],
  ] as const
  return (
    <header className="headbar">
      <div className="px-2 sm:px-4 py-2.5 flex items-center gap-1 sm:gap-3 max-w-full">
        {/* Logo Section - Compact */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden shadow-lg flex-shrink-0 bg-gradient-to-br from-black/20 to-black/10">
            <img src="/logo.png" alt="WAVE" className="h-full w-full object-cover" />
          </div>
          <div className="font-bold text-sm sm:text-base bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent drop-shadow-sm">
            WAVE
          </div>
        </div>
        
        {/* Navigation - Optimized for space */}
        <nav className="flex gap-0.5 sm:gap-1 flex-1 justify-center min-w-0">
          {tabs.map(([to, icon, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-1 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-white border border-blue-400/40 shadow-lg shadow-blue-500/25 scale-105' 
                    : 'hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 hover:text-white hover:scale-105 hover:shadow-md text-gray-300'
                }`
              }
              title={label}
              >
              <span className="text-base sm:text-lg">{icon}</span>
              <span className="hidden lg:inline text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Right Section - Compact */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Music Button - Smaller */}
          <button 
            onClick={onToggleMusic}
            className={`music-btn p-1.5 sm:p-2 rounded-full transition-all duration-300 ${
              isPlaying 
                ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/40 shadow-lg shadow-green-500/25' 
                : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30'
            }`}
            title={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
          </button>
          
          {!email ? (
            <button className="google-btn px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium" onClick={onGoogle}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="hidden sm:inline">Sign in</span>
            </button>
          ) : (
            <details className="relative">
              <summary className="list-none cursor-pointer px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-white/15 to-white/10 hover:from-white/25 hover:to-white/15 text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/30">
                <span className="max-w-[60px] sm:max-w-[100px] truncate inline-block">{email}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-44 sm:w-52 card p-2 grid gap-1 text-xs sm:text-sm">
                <button className="btn-ghost text-left hover:scale-105 transition-all duration-300" onClick={onSwitch}>
                  Switch account
                </button>
                <button className="btn-ghost text-left hover:scale-105 transition-all duration-300" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App(){
  const { theme, applyTheme } = useTheme()
  const [email, setEmail] = useState<string | null>(null)
  const deviceId = useDeviceId()
  const { isPlaying, toggleMusic } = useMusic()
  const [focusMode, setFocusMode] = useState(false)

  useEffect(()=>{
    applyTheme(theme)
    const sub = supabase.auth.onAuthStateChange(async ()=>{
      const u = await getUser()
      setEmail(u?.email ?? null)
    })
    ;(async()=>{ const u = await getUser(); setEmail(u?.email ?? null) })()
    return ()=>{ sub.data.subscription.unsubscribe() }
  },[theme, applyTheme])

  // Listen for global focus mode toggle events (from Meditation page)
  useEffect(() => {
    const onFocusMode = (e: Event) => {
      try {
        const ce = e as CustomEvent<boolean>
        setFocusMode(Boolean(ce.detail))
      } catch {}
    }
    window.addEventListener('wave:focus-mode', onFocusMode as EventListener)
    return () => window.removeEventListener('wave:focus-mode', onFocusMode as EventListener)
  }, [])

  const onGoogle = async () => { await signInWithGoogle() }
  const onSignOut = async () => { await signOut(); setEmail(null) }
  const onSwitch = async () => { await signInWithGoogle() }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      {!focusMode && (
        <Headbar 
          email={email} 
          onGoogle={onGoogle} 
          onSignOut={onSignOut} 
          onSwitch={onSwitch}
          isPlaying={isPlaying}
          onToggleMusic={toggleMusic}
        />
      )}
      <main className={`max-w-6xl mx-auto p-4 ${focusMode ? 'pt-6' : 'pt-24'} grid gap-4 relative z-10`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mood" element={<Mood deviceId={deviceId} />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/journal" element={<Journal deviceId={deviceId} />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/settings" element={<Settings deviceId={deviceId} />} />
        </Routes>
      </main>
    </div>
  )
}
