
import { useState } from 'react'
import { apiModerate } from '../services/api'

export default function Crisis(){
  const [text, setText] = useState('')
  const [flagged, setFlagged] = useState(false)
  async function check(){ const f = await apiModerate(text); setFlagged(f) }
  return (
    <div className="grid gap-4">
      <div className="card p-4 grid gap-3">
        <textarea className="card p-3 min-h-[120px]" placeholder="Write how you feel…"
          value={text} onChange={e=>setText(e.target.value)} />
        <button className="btn w-fit" onClick={check}>Check Crisis</button>
      </div>
      {flagged && (
        <div className="card p-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Let’s breathe together (4–4–6)</h3>
          <div className="breathing" aria-label="breathing animation" />
          <div className="mt-3 grid gap-1 text-sm">
            <a className="link" href="tel:14416">Tele-MANAS 14416</a>
            <a className="link" href="tel:18005990019">KIRAN 1800-599-0019</a>
          </div>
        </div>
      )}
    </div>
  )
}
