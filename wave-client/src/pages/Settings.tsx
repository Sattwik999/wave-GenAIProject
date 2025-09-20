
import { useEffect, useState } from 'react'
import { useTheme } from '../services/theme'
import { supabase } from '../services/supabaseClient'
import { apiJournalDeleteAll, apiJournalList, apiMoodDeleteAll, apiMoodList, apiClaim } from '../services/api'

export default function Settings({ deviceId }:{ deviceId:string }){
  const { theme, setTheme, stigmaShield, setShield, applyTheme } = useTheme()
  const [email, setEmail] = useState<string | null>(null)
  const [token, setToken] = useState<string | undefined>(undefined)

  useEffect(()=>{
    applyTheme(theme)
    ;(async()=>{
      const sess = await supabase.auth.getSession()
      setToken(sess.data.session?.access_token)
      const u = (await supabase.auth.getUser()).data.user
      setEmail(u?.email ?? null)
    })()
  }, [theme, applyTheme])

  async function exportData(){
    const mood = await apiMoodList(deviceId, token)
    const journ = await apiJournalList(deviceId, token)
    const blob = new Blob([JSON.stringify({ mood, journ }, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'wave-export.json'; a.click()
    URL.revokeObjectURL(url)
  }
  async function deleteAll(){
    if (!confirm('Delete all your mood logs and journals?')) return
    await apiMoodDeleteAll(deviceId, token)
    await apiJournalDeleteAll(deviceId, token)
    alert('Deleted.')
  }
  async function claim(){
    if (!token) return alert('Sign in with Google first.')
    await apiClaim(deviceId, token)
    alert('Data claimed to your Google account.')
  }

  return (
    <div className="grid gap-4">
      <div className="card p-4 grid gap-3">
        <div className="flex items-center gap-3">
          <label>Theme</label>
          <select className="card px-2 py-1" value={theme}
                  onChange={(e)=>{ setTheme(e.target.value as any); applyTheme(e.target.value as any) }}>
            <option value="bluey">Bluey</option>
            <option value="calm">Calm</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label>Stigma Shield</label>
          <input type="checkbox" checked={stigmaShield} onChange={(e)=>setShield(e.target.checked)} />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={exportData}>Export my data</button>
          <button className="btn-ghost" onClick={deleteAll}>Delete my data</button>
          <button className="btn" onClick={claim}>Claim my data to Google account</button>
        </div>
        <div className="opacity-80 text-sm">
          {email ? `Signed in as ${email}` : 'Currently using guest mode. Sign in with Google from the top bar.'}
        </div>
      </div>
    </div>
  )
}
