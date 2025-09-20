
import { useEffect, useState } from 'react'
import { apiAR, apiJournalList, apiMoodList } from '../services/api'
import { supabase } from '../services/supabaseClient'

export default function AR({ deviceId }:{ deviceId:string }){
  const [scene, setScene] = useState<'forest'|'beach'|'mountain'>('forest')
  const [tip, setTip] = useState('')
  useEffect(()=>{ (async()=>{
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    const j = await apiJournalList(deviceId, token)
    const latest = j.items?.[0]?.content ?? ''
    const m = await apiMoodList(deviceId, token)
    const mood = m.items?.[0]?.mood ?? 3
    const r = await apiAR(latest, mood)
    setScene(r.scene)
    if (r.scene === 'forest') setTip('Soft focus, slow breaths. Notice three sounds around you.')
    if (r.scene === 'beach') setTip('Imagine waves syncing with your breath. Inhale with the crest, exhale with the foam.')
    if (r.scene === 'mountain') setTip('Picture a steady climb. One small step, then the next.')
  })() },[deviceId])
  const title = scene==='forest'?'🌲 Forest': scene==='beach'?'🏖️ Beach':'⛰️ Mountain'
  return (
    <div className="card p-6 text-center">
      <div className="h-48 rounded-2xl flex items-center justify-center text-2xl font-semibold"
           style={{ background: 'linear-gradient(135deg, var(--accent), rgba(255,255,255,0.1))' }}>
        {title}
      </div>
      <p className="mt-4 opacity-90">{tip}</p>
    </div>
  )
}
