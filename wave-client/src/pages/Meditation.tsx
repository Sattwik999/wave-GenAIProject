import { useEffect, useMemo, useRef, useState } from 'react'

type Phase = 'inhale' | 'hold' | 'exhale'

type PatternKey = 'box' | 'fourSevenEight' | 'calm'

const BREATH_PATTERNS: Record<PatternKey, { label: string; inhale: number; hold: number; exhale: number }> = {
  box: { label: 'Box 4-4-4', inhale: 4, hold: 4, exhale: 4 },
  fourSevenEight: { label: '4-7-8', inhale: 4, hold: 7, exhale: 8 },
  calm: { label: 'Calm 4-6', inhale: 4, hold: 0, exhale: 6 },
}

const CUSTOM_PATTERNS: Record<string, { label: string; inhale: number; hold: number; exhale: number }> = {}

const SCENES = [
  { key: 'dawn', label: 'Dawn Glow', className: 'from-rose-300/20 via-orange-300/20 to-yellow-300/20' },
  { key: 'night', label: 'Night Sky', className: 'from-indigo-500/20 via-purple-500/20 to-slate-600/20' },
  { key: 'ocean', label: 'Ocean Calm', className: 'from-cyan-400/20 via-blue-500/20 to-sky-600/20' },
]

const QUICK_PRESETS = [
  { label: 'Quick Focus', minutes: 5, pattern: 'calm' as PatternKey, scene: 'dawn' },
  { label: 'Deep Session', minutes: 20, pattern: 'fourSevenEight' as PatternKey, scene: 'night' },
  { label: 'Stress Relief', minutes: 10, pattern: 'box' as PatternKey, scene: 'ocean' },
]

const CHIME_TONES = [
  { key: 'soft', label: 'Soft Bell', file: '/audio/chime.mp3' },
  { key: 'tibetan', label: 'Tibetan Bowl', file: '/audio/chime.mp3' }, // Would use different files
  { key: 'nature', label: 'Nature Sound', file: '/audio/chime.mp3' },
]

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Meditation() {
  const [pattern, setPattern] = useState<PatternKey>('calm')
  const [scene, setScene] = useState(SCENES[1].key) // Default to Night Sky
  const [phase, setPhase] = useState<Phase>('inhale')
  const [running, setRunning] = useState(false)
  const [minutes, setMinutes] = useState(10)
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  const [volume, setVolume] = useState(0.5)
  const [focusMode, setFocusMode] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [voiceGuidance, setVoiceGuidance] = useState(false)
  const [selectedChime, setSelectedChime] = useState(CHIME_TONES[0])
  const [favorites, setFavorites] = useState<Array<{name: string; pattern: PatternKey; scene: string; minutes: number}>>(() => {
    try { return JSON.parse(localStorage.getItem('wave-meditation-favorites') || '[]') } catch { return [] }
  })
  const [history, setHistory] = useState<Array<{ ts: number; minutes: number; pattern: string; reflection?: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('wave-meditation-history') || '[]') } catch { return [] }
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chimeRef = useRef<HTMLAudioElement | null>(null)
  const voiceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  const patternCfg = BREATH_PATTERNS[pattern]
  const currentScene = useMemo(() => SCENES.find(s => s.key === scene)!, [scene])
  const totalSeconds = minutes * 60
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (running) onPause(); else onStart()
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setMinutes(prev => Math.min(60, prev + 5))
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setMinutes(prev => Math.max(5, prev - 5))
      }
      if (e.code === 'Escape' && focusMode) {
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [running, focusMode])

  // Haptic feedback for mobile
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  // Initialize local ambient audio for the room
  useEffect(() => {
    // Use the requested OM meditation track; encode spaces/characters for URL safety
    const audio = new Audio(encodeURI('/audio/15 Minutes OM Meditation(MP3_160K).mp3'))
    audio.loop = true
    audio.volume = volume
    audio.preload = 'metadata'
    audioRef.current = audio
    // Soft chime for completion
    const chime = new Audio(selectedChime.file)
    chime.preload = 'metadata'
    chime.volume = 0.6
    chimeRef.current = chime
    return () => {
      audio.pause()
      audioRef.current = null
      chimeRef.current = null
    }
  }, [selectedChime])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Timer control
  useEffect(() => {
    setTimeLeft(minutes * 60)
  }, [minutes])

  useEffect(() => {
    if (!running) return
    if (timeLeft <= 0) {
      setRunning(false)
      // Gentle end: quick fade out
      if (audioRef.current) audioRef.current.pause()
      // Play chime and save session
      try { chimeRef.current && chimeRef.current.play() } catch {}
      triggerHaptic()
      // Show reflection prompt
      setShowReflection(true)
      try {
        const item = { ts: Date.now(), minutes, pattern: BREATH_PATTERNS[pattern].label, reflection: '' }
        const next = [item, ...history].slice(0, 10)
        setHistory(next)
        localStorage.setItem('wave-meditation-history', JSON.stringify(next))
      } catch {}
      return
    }
    intervalRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [running, timeLeft, minutes, pattern, history])

  // Breathing phase cycle
  useEffect(() => {
    if (!running) return
    const next = (p: Phase): { next: Phase; delay: number } => {
      if (p === 'inhale') return { next: patternCfg.hold > 0 ? 'hold' : 'exhale', delay: patternCfg.inhale * 1000 }
      if (p === 'hold') return { next: 'exhale', delay: patternCfg.hold * 1000 }
      return { next: 'inhale', delay: patternCfg.exhale * 1000 }
    }
    const { next: n, delay } = next(phase)
    
    // Voice guidance
    if (voiceGuidance && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        phase === 'inhale' ? 'Breathe in' : 
        phase === 'hold' ? 'Hold' : 'Breathe out'
      )
      utterance.volume = 0.3
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
    
    timeoutRef.current = window.setTimeout(() => setPhase(n), delay)
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [running, phase, patternCfg, voiceGuidance])

  const onStart = async () => {
    if (countdown > 0) return
    setCountdown(3)
    setAnnounce('Starting in 3... 2... 1...')
    
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer)
          setPhase('inhale')
          setTimeLeft(minutes * 60)
          setRunning(true)
          triggerHaptic()
          try { audioRef.current?.play() } catch {}
          setAnnounce('Session started')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const onPause = () => {
    setRunning(false)
    audioRef.current?.pause()
    triggerHaptic()
    setAnnounce('Session paused')
  }
  
  const onReset = () => {
    setRunning(false)
    setPhase('inhale')
    setTimeLeft(minutes * 60)
    audioRef.current?.pause()
    setCountdown(0)
    setAnnounce('Session reset')
  }

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setMinutes(preset.minutes)
    setPattern(preset.pattern)
    setScene(preset.scene)
    setAnnounce(`Applied ${preset.label} preset`)
  }

  const saveFavorite = () => {
    const name = `${BREATH_PATTERNS[pattern].label} - ${minutes}min`
    const newFav = { name, pattern, scene, minutes }
    const updated = [newFav, ...favorites.filter(f => f.name !== name)].slice(0, 5)
    setFavorites(updated)
    localStorage.setItem('wave-meditation-favorites', JSON.stringify(updated))
    setAnnounce('Saved to favorites')
  }

  const saveReflection = () => {
    const updated = history.map((h, i) => 
      i === 0 ? { ...h, reflection: reflectionText } : h
    )
    setHistory(updated)
    localStorage.setItem('wave-meditation-history', JSON.stringify(updated))
    setShowReflection(false)
    setReflectionText('')
    setAnnounce('Reflection saved')
  }

  const scale = phase === 'inhale' ? 1.15 : phase === 'exhale' ? 0.85 : 1.0
  const prompt = phase === 'inhale' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out'

  // Enhanced animations based on phase
  const omAnimation = !running ? 'omPulse 4s ease-in-out infinite' :
    phase === 'inhale' ? `omInhale ${patternCfg.inhale}s ease-out forwards` :
    phase === 'exhale' ? `omExhale ${patternCfg.exhale}s ease-in forwards` :
    'omPulse 2s ease-in-out infinite'

  // Scene-specific particle effects
  const renderSceneEffects = () => {
    if (scene === 'night') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Twinkling stars */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
          {/* Shooting stars */}
          {[...Array(2)].map((_, i) => (
            <div
              key={`shooting-${i}`}
              className="absolute w-0.5 h-12 bg-gradient-to-b from-white to-transparent opacity-0"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 40}%`,
                animation: `shootingStar ${8 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${i * 6}s`
              }}
            />
          ))}
          {/* Nebula effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-indigo-800/5 to-violet-900/10 animate-pulse" />
        </div>
      )
    }
    if (scene === 'ocean') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Wave particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full opacity-0"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${50 + Math.random() * 40}%`,
                animation: `waveParticle ${4 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`
              }}
            />
          ))}
          {/* Flowing gradient overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, rgba(6,182,212,0.1), rgba(59,130,246,0.1), rgba(6,182,212,0.1))',
              backgroundSize: '200% 200%',
              animation: 'gradientFlow 8s ease-in-out infinite'
            }}
          />
        </div>
      )
    }
    if (scene === 'dawn') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Sun rays */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-32 bg-gradient-to-t from-transparent via-orange-300/20 to-transparent origin-bottom"
              style={{
                left: '50%',
                bottom: '20%',
                transform: `rotate(${i * 45}deg)`,
                animation: `fadeInOut ${6 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
          {/* Warm glow */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 80%, rgba(251,146,60,0.3), rgba(249,115,22,0.2), transparent 70%)',
              animation: 'fadeInOut 8s ease-in-out infinite'
            }}
          />
        </div>
      )
    }
    return null
  }

  // Enhanced OM Symbol Component
  const OmSymbol = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div 
        className={`relative ${focusMode ? 'w-32 h-32' : 'w-20 h-20'} transition-all duration-1000 rounded-full overflow-hidden`}
        style={{ animation: omAnimation }}
      >
        {/* Circular background with glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-600/20 blur-sm" />
        
        {/* OM Mandala Image */}
        <img
          src="/om-hindu-symbol-with-mandala-free-vector.jpg"
          alt="OM Symbol with Mandala"
          className={`w-full h-full object-cover rounded-full ${focusMode ? 'drop-shadow-2xl' : 'drop-shadow-lg'}`}
          style={{
            filter: 'brightness(1.1) contrast(1.2) saturate(1.1)',
            boxShadow: '0 0 20px rgba(147,51,234,0.4), inset 0 0 20px rgba(255,255,255,0.1)'
          }}
        />
        
        {/* Overlay ring for enhancement */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 shadow-inner" />
        
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-purple-400/10 to-transparent"
          style={{ animation: 'omPulse 4s ease-in-out infinite' }}
        />
      </div>
    </div>
  )

  // Floating particles around breathing circle
  const renderBreathingParticles = () => {
    if (!running) return null
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-br from-purple-300 to-indigo-400 rounded-full opacity-0"
            style={{
              left: `${50 + 35 * Math.cos((i * 22.5) * Math.PI / 180)}%`,
              top: `${50 + 35 * Math.sin((i * 22.5) * Math.PI / 180)}%`,
              animation: `particle ${5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    )
  }

  const toggleFocusMode = () => {
    const next = !focusMode
    const enterFullscreen = async () => {
      const docEl: any = document.documentElement as any
      try {
        if (docEl.requestFullscreen) await docEl.requestFullscreen()
        else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen()
        else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen()
      } catch {}
    }
    const exitFullscreen = async () => {
      const doc: any = document as any
      try {
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen()
        else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) await doc.webkitExitFullscreen()
        else if (doc.msFullscreenElement && doc.msExitFullscreen) await doc.msExitFullscreen()
      } catch {}
    }

    if (next) enterFullscreen(); else exitFullscreen()
    setFocusMode(next)
    // Inform App to hide/show header
    window.dispatchEvent(new CustomEvent('wave:focus-mode', { detail: next }))
  }

  // Keep focus mode UI in sync if user exits fullscreen via ESC or browser UI
  useEffect(() => {
    const onFsChange = () => {
      const anyDoc: any = document as any
      const active = !!(document.fullscreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement)
      if (!active && focusMode) {
        setFocusMode(false)
        window.dispatchEvent(new CustomEvent('wave:focus-mode', { detail: false }))
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange as any)
    document.addEventListener('msfullscreenchange', onFsChange as any)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange as any)
      document.removeEventListener('msfullscreenchange', onFsChange as any)
    }
  }, [focusMode])

  // Cleanup: exit fullscreen if still active on unmount
  useEffect(() => {
    return () => {
      const anyDoc: any = document as any
      if (document.fullscreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement) {
        try { document.exitFullscreen?.() } catch {}
        try { anyDoc.webkitExitFullscreen?.() } catch {}
        try { anyDoc.msExitFullscreen?.() } catch {}
      }
    }
  }, [])

  return (
    <div className={focusMode ? 'flex items-center justify-center min-h-[70vh]' : 'grid md:grid-cols-[1fr,360px] gap-4'}>
      {/* Accessible live region for announcements */}
      <div aria-live="polite" className="sr-only">{announce}</div>
      
      {/* Reflection Modal */}
      {showReflection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowReflection(false)}>
          <div className="card p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">How was your session?</h3>
            <textarea
              className="w-full h-24 p-3 bg-white/10 border border-white/20 rounded-lg resize-none"
              placeholder="Take a moment to reflect..."
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button className="btn flex-1" onClick={saveReflection}>Save Reflection</button>
              <button className="btn-ghost" onClick={() => setShowReflection(false)}>Skip</button>
            </div>
          </div>
        </div>
      )}

      <section className={`card relative overflow-hidden ${focusMode ? 'p-8 sm:p-10' : 'p-6'} flex items-center justify-center ${focusMode ? 'min-h-[500px]' : 'min-h-[420px]'}`}
        style={{
          backgroundImage: focusMode 
            ? 'radial-gradient(circle at center, rgba(0,0,0,0.9), rgba(0,0,0,0.95))'
            : `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)), radial-gradient(1200px 600px at 50% -20%, rgba(255,255,255,0.06), transparent)`,
        }}
      >
        {/* Scene background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentScene.className} pointer-events-none ${focusMode ? 'opacity-40' : 'opacity-60'}`} />
        
        {/* Scene effects */}
        {renderSceneEffects()}
        
        {/* Focus mode ambient effects */}
        {focusMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-br from-purple-400/40 to-indigo-500/40 rounded-full opacity-0"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${15 + Math.random() * 70}%`,
                  animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        )}
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Session countdown */}
          {countdown > 0 && (
            <div className="absolute -top-24 text-7xl font-bold text-purple-300 z-20" style={{ animation: 'countdownPulse 1s ease-out' }}>
              {countdown}
            </div>
          )}
          
          {/* Timer */}
          <div className={`text-5xl font-bold tracking-tight ${focusMode ? 'text-6xl' : ''} transition-all duration-500`}>
            {formatTime(timeLeft)}
          </div>
          
          {/* Breathing prompt */}
          <div className={`${focusMode ? 'text-4xl md:text-5xl' : 'text-xl md:text-2xl'} font-semibold opacity-90 transition-all duration-1000 text-center`}>
            {prompt}
          </div>
          
          {/* Breathing circle with progress ring */}
          <div className="relative flex items-center justify-center">
            {/* Outer progress ring */}
            <svg className={`absolute ${focusMode ? 'w-80 h-80' : 'w-64 h-64'} -rotate-90 transition-all duration-500`}>
              <circle
                cx="50%"
                cy="50%"
                r={focusMode ? "140" : "110"}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <circle
                cx="50%"
                cy="50%"
                r={focusMode ? "140" : "110"}
                fill="none"
                stroke="rgba(147,51,234,0.6)"
                strokeWidth="3"
                strokeDasharray={focusMode ? "879" : "691"}
                strokeDashoffset={focusMode ? 879 - (879 * progressPercent / 100) : 691 - (691 * progressPercent / 100)}
                className="transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Main breathing circle */}
            <div
              className={`relative ${focusMode ? 'w-72 h-72' : 'w-56 h-56'} rounded-full border-2 border-white/20 shadow-2xl transition-all duration-[1200ms] ease-in-out z-10`}
              style={{ 
                transform: `scale(${scale})`, 
                animation: running ? 'circleGlow 6s ease-in-out infinite' : undefined
              }}
            >
              {/* Inner circle rings */}
              <div className="absolute inset-4 rounded-full border border-white/10" />
              <div className="absolute inset-8 rounded-full border border-white/5" />
              
              {/* Base gradient background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5" />
              
              {/* Breathing fill effect */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 transition-opacity duration-1000"
                style={{ opacity: phase === 'inhale' ? 0.7 : phase === 'exhale' ? 0.2 : 0.4 }}
              />
              
              {/* Enhanced OM symbol */}
              <OmSymbol />
              
              {/* Breathing particles */}
              {renderBreathingParticles()}
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center gap-3 mt-4 z-20">
            {!running && countdown === 0 ? (
              <button className="btn text-lg px-6 py-3 animate-pulse bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300" onClick={onStart}>
                Start Session
              </button>
            ) : running ? (
              <button className="btn text-lg px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400" onClick={onPause}>
                Pause
              </button>
            ) : null}
            {!focusMode && (
              <button className="btn-ghost px-4 py-2" onClick={onReset}>Reset</button>
            )}
            <button 
              className={`btn-ghost px-4 py-2 ${focusMode ? 'ring-2 ring-purple-400 bg-purple-500/20' : 'hover:bg-purple-500/10'} transition-all duration-300`} 
              onClick={toggleFocusMode} 
              title="Focus mode (fullscreen)"
            >
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </button>
          </div>
        </div>
      </section>

      {!focusMode && (
      <aside className="card p-4 grid gap-4 h-fit max-h-[80vh] overflow-y-auto">
        {/* Quick Presets */}
        <div>
          <div className="font-semibold mb-2">Quick Start</div>
          <div className="grid gap-2">
            {QUICK_PRESETS.map(preset => (
              <button 
                key={preset.label}
                className="btn-ghost text-left p-2 hover:scale-105 transition-transform"
                onClick={() => applyPreset(preset)}
              >
                <div className="font-medium text-sm">{preset.label}</div>
                <div className="text-xs opacity-75">{preset.minutes}min • {BREATH_PATTERNS[preset.pattern].label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="font-semibold mb-2">Duration</div>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20, 30, 45].map(m => (
              <button key={m} className={`btn-ghost ${minutes === m ? 'ring-1 ring-white/30' : ''}`} onClick={() => setMinutes(m)}>
                {m}min
              </button>
            ))}
          </div>
        </div>

        {/* Breathing Pattern */}
        <div>
          <div className="font-semibold mb-2">Breathing Pattern</div>
          <div className="grid gap-2">
            {Object.entries(BREATH_PATTERNS).map(([key, cfg]) => (
              <label key={key} className={`card p-2 flex items-center justify-between hover:bg-white/5 transition-colors ${pattern === key ? 'border-white/30' : ''}`}>
                <div>
                  <div className="font-medium text-sm">{cfg.label}</div>
                  <div className="text-xs opacity-75">Inhale {cfg.inhale}s • Hold {cfg.hold}s • Exhale {cfg.exhale}s</div>
                </div>
                <input type="radio" name="pattern" checked={pattern === key} onChange={() => setPattern(key as PatternKey)} />
              </label>
            ))}
          </div>
        </div>

        {/* Scene */}
        <div>
          <div className="font-semibold mb-2">Scene</div>
          <div className="flex flex-wrap gap-2">
            {SCENES.map(s => (
              <button key={s.key} className={`btn-ghost ${scene === s.key ? 'ring-1 ring-white/30' : ''}`} onClick={() => setScene(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Controls */}
        <div>
          <div className="font-semibold mb-2">Audio</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button className="btn-ghost" onClick={() => audioRef.current?.paused ? audioRef.current?.play() : audioRef.current?.pause()}>
                {audioRef.current?.paused ?? true ? 'Play' : 'Pause'}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Voice Guidance</span>
              <button 
                className={`relative group px-4 py-2 rounded-lg border transition-all duration-300 ${
                  voiceGuidance 
                    ? 'bg-purple-600/30 border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20' 
                    : 'bg-gray-600/20 border-gray-500/30 text-gray-300 hover:bg-gray-500/30'
                } hover:scale-105 transform`}
                onClick={() => setVoiceGuidance(!voiceGuidance)}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13.31a.5.5 0 00-.336-.135H2a1 1 0 01-1-1V8a1 1 0 011-1h2.51a.5.5 0 00.336-.135l3.537-3.505a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    {voiceGuidance ? 'On' : 'Off'}
                  </span>
                </div>
                
                {/* Pulse animation when active */}
                {voiceGuidance && (
                  <>
                    <div className="absolute inset-0 rounded-lg bg-purple-500/20 animate-pulse" />
                    <div className="absolute -inset-1 rounded-lg bg-purple-500/10" style={{ animation: 'voiceButtonGlow 2s ease-in-out infinite' }} />
                  </>
                )}
              </button>
            </div>
            
            <div>
              <div className="text-sm mb-1">Completion chime</div>
              <select 
                value={selectedChime.key} 
                onChange={(e) => setSelectedChime(CHIME_TONES.find(t => t.key === e.target.value) || CHIME_TONES[0])}
                className="w-full p-1 bg-white/10 border border-white/20 rounded text-sm"
              >
                {CHIME_TONES.map(tone => (
                  <option key={tone.key} value={tone.key}>{tone.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Favorites */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Favorites</div>
            <button className="btn-ghost text-xs" onClick={saveFavorite}>Save Current</button>
          </div>
          {favorites.length > 0 ? (
            <div className="space-y-1">
              {favorites.map((fav, i) => (
                <button
                  key={i}
                  className="w-full text-left p-2 text-xs bg-white/5 rounded hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setPattern(fav.pattern)
                    setScene(fav.scene)
                    setMinutes(fav.minutes)
                  }}
                >
                  {fav.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs opacity-60">No favorites saved</div>
          )}
        </div>

        {/* Session History */}
        {history.length > 0 && (
          <div>
            <div className="font-semibold mb-2">Recent Sessions</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((h, i) => (
                <div key={h.ts} className="text-xs p-2 bg-white/5 rounded">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">{new Date(h.ts).toLocaleDateString()}</span>
                    <span className="font-medium">{h.minutes}m • {h.pattern}</span>
                  </div>
                  {h.reflection && (
                    <div className="mt-1 opacity-70 italic">"{h.reflection.slice(0, 50)}..."</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts */}
        <div className="text-xs opacity-60 border-t border-white/10 pt-3">
          <div className="font-medium mb-1">Shortcuts</div>
          <div>Space: Start/Pause • ↑↓: Duration • Esc: Exit Focus</div>
        </div>
      </aside>
      )}
    </div>
  )
}
