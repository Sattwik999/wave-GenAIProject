
import { useEffect, useState } from 'react'
import { apiPulse } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Pulse(){
  const [data, setData] = useState<{day:string,v:number}[]>([])
  useEffect(()=>{ (async()=>{
    const r = await apiPulse()
    const byDay = r.byDay || { Mon:3.2, Tue:3.8, Wed:3.5, Thu:3.9, Fri:3.7, Sat:3.4, Sun:3.6 }
    const arr = Object.entries(byDay).map(([day, v]) => ({ day, v: Number(v) }))
    setData(arr)
  })() },[])

  return (
    <div className="card p-4">
      <h2 className="text-xl font-semibold mb-4">Community Pulse</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[1, 5]} />
            <Tooltip />
            <Bar dataKey="v" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="opacity-70 mt-2 text-sm">Shows this week’s average mood by day. Uses demo if the aggregate row is missing.</p>
    </div>
  )
}
