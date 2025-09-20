
import { useEffect, useState } from 'react'
import { apiJournalAdd, apiJournalList } from '../services/api'
import { supabase } from '../services/supabaseClient'

export default function Journal({ deviceId }:{ deviceId:string }){
  const [text, setText] = useState('')
  const [timeCapsule, setTimeCapsule] = useState('')
  const [items, setItems] = useState<any[]>([])

  async function refresh(){
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    const r = await apiJournalList(deviceId, token)
    setItems(r.items || [])
  }
  useEffect(()=>{ refresh() }, [])

  async function add(){
    if (!text.trim()) return
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    await apiJournalAdd(text.trim(), timeCapsule || null, deviceId, token)
    setText(''); setTimeCapsule('')
    refresh()
  }

  return (
    <div className="grid gap-4">
      <div className="card p-4 grid gap-3">
        <textarea className="card p-3 min-h-[100px]" placeholder="Write something…"
          value={text} onChange={e=>setText(e.target.value)} />
        <div className="flex items-center gap-3">
          <label className="opacity-80 text-sm">Time capsule:</label>
          <input type="date" className="card px-2 py-1" value={timeCapsule} onChange={e=>setTimeCapsule(e.target.value)} />
          <button className="btn ml-auto" onClick={add}>Add</button>
        </div>
      </div>
      <div className="grid gap-2">
        {items.map((it:any)=>{
          const due = it.time_capsule_at ? new Date(it.time_capsule_at).getTime() < Date.now() : false
          return (
            <div key={it.id} className="card p-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs opacity-70">{new Date(it.created_at).toLocaleString()}</span>
                {due && <span className="ml-auto text-xs px-2 py-0.5 rounded-xl bg-white/10">⏰ Time capsule ready</span>}
              </div>
              <p>{it.content}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
