
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Mood from './pages/Mood'
import Pulse from './pages/Pulse'
import Journal from './pages/Journal'
import Crisis from './pages/Crisis'
import AR from './pages/AR'
import Settings from './pages/Settings'
import { useEffect, useState } from 'react'
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

const Headbar = ({ email, onGoogle, onSignOut, onSwitch }: any) => {
  const tabs = [
    ['/', 'Home'], ['/chat', 'Chat'], ['/mood', 'Mood'], ['/journal', 'Journal'],
    ['/pulse', 'Pulse'], ['/ar', 'AR'], ['/crisis', 'Panic'], ['/settings', 'Settings'],
  ] as const
  return (
    <header className="headbar">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2">
        <img src="/logo.png" alt="WAVE" className="h-8 w-auto" />
        <div className="font-semibold ml-1">WAVE</div>
        <nav className="mx-auto flex gap-1 sm:gap-2 overflow-x-auto">
          {tabs.map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl ${isActive ? 'bg-white/10' : 'hover:bg-white/5'} whitespace-nowrap`
              }>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="relative">
          {!email ? (
            <button className="btn" onClick={onGoogle}>Continue with Google</button>
          ) : (
            <details className="relative">
              <summary className="list-none cursor-pointer px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm">
                {email}
              </summary>
              <div className="absolute right-0 mt-2 w-56 card p-2 grid gap-1 text-sm">
                <button className="btn-ghost text-left" onClick={onSwitch}>Switch account</button>
                <button className="btn-ghost text-left" onClick={onSignOut}>Sign out</button>
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

  useEffect(()=>{
    applyTheme(theme)
    const sub = supabase.auth.onAuthStateChange(async ()=>{
      const u = await getUser()
      setEmail(u?.email ?? null)
    })
    ;(async()=>{ const u = await getUser(); setEmail(u?.email ?? null) })()
    return ()=>{ sub.data.subscription.unsubscribe() }
  },[theme, applyTheme])

  const onGoogle = async () => { await signInWithGoogle() }
  const onSignOut = async () => { await signOut(); setEmail(null) }
  const onSwitch = async () => { await signInWithGoogle() }

  return (
    <div className="min-h-screen">
      <Headbar email={email} onGoogle={onGoogle} onSignOut={onSignOut} onSwitch={onSwitch} />
      <main className="max-w-6xl mx-auto p-4 grid gap-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mood" element={<Mood deviceId={deviceId} />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/journal" element={<Journal deviceId={deviceId} />} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/ar" element={<AR deviceId={deviceId} />} />
          <Route path="/settings" element={<Settings deviceId={deviceId} />} />
        </Routes>
      </main>
    </div>
  )
}
