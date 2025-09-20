
import { useEffect, useState } from 'react'
import { apiMoodAdd, apiMoodList } from '../services/api'
import { supabase } from '../services/supabaseClient'

export default function Mood({ deviceId }:{ deviceId:string }){
  const [mood, setMood] = useState(3)
  const [saved, setSaved] = useState('')
  const [items, setItems] = useState<any[]>([])

  async function refresh(){
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    const res = await apiMoodList(deviceId, token)
    setItems(res.items || [])
  }
  useEffect(()=>{ refresh() }, [])

  async function onSave(){
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    await apiMoodAdd(mood, deviceId, token)
    setSaved('Saved ✓'); setTimeout(()=>setSaved(''), 1500)
    refresh()
  }

  return (
    <div className="grid gap-4">
      <div className="card p-4 grid gap-4">
        <h2 className="text-xl font-semibold">How are you feeling?</h2>
        <input type="range" min={1} max={5} value={mood} onChange={e=>setMood(parseInt(e.target.value))} />
        <div className="flex items-center gap-3">
          <button className="btn" onClick={onSave}>Save</button>
          <span className="opacity-80">{saved}</span>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-medium mb-2">Recent moods</h3>
        <div className="grid gap-1 text-sm">
          {items.map((it:any)=>(
            <div key={it.id} className="flex justify-between py-1 border-b border-white/5">
              <span>{new Date(it.created_at).toLocaleString()}</span>
              <span>🌡️ {it.mood}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
