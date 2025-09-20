
import { useEffect, useRef, useState } from 'react'
import { apiChat, apiModerate } from '../services/api'
import { demoReply } from '../services/demoAI'
import { supabase } from '../services/supabaseClient'

type Msg = { from: 'user' | 'bot', text: string }

export default function Chat(){
  const [msgs, setMsgs] = useState<Msg[]>([{ from:'bot', text:'Hi! I’m here to listen. What’s on your mind today?' }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, typing])

  async function send(){
    if (!input.trim()) return
    const text = input.trim()
    setMsgs(m=>[...m, { from:'user', text }])
    setInput(''); setTyping(true)
    try{
      const flagged = await apiModerate(text)
      if (flagged){ setMsgs(m=>[...m, { from:'bot', text:'This might be urgent. Try the Panic page for breathing and helplines.' }]); return }
      let reply = ''
      try{ reply = await apiChat(text) } catch{ reply = demoReply(text) }
      setMsgs(m=>[...m, { from:'bot', text: reply }])
    } finally { setTyping(false) }
  }

  return (
    <div className="grid gap-4">
      <div className="card p-4 max-h-[60vh] overflow-y-auto">
        {msgs.map((m,i)=>(
          <div key={i} className={`my-2 flex ${m.from==='user'?'justify-end':'justify-start'}`}>
            <div className={`px-3 py-2 rounded-xl max-w-[80%] ${m.from==='user'?'bg-white/10':'bg-white/5'}`}>{m.text}</div>
          </div>
        ))}
        {typing && <div className="opacity-70 text-sm">typing…</div>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <input className="flex-1 card px-3 py-2" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send() }} placeholder="Type something…" />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  )
}
