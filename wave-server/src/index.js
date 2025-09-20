
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 8787
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } })

async function getUserIdFromAuth(req) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data, error } = await supabase.auth.getUser(token)
    if (error) return null
    return data?.user?.id ?? null
  } catch {
    return null
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/chat', async (req, res) => {
  const { text } = req.body || {}
  if (!text) return res.status(400).json({ error: 'text required' })
  if (!GEMINI_API_KEY) {
    return res.json({ reply: "I hear you—thanks for sharing. Try a 4-4-6 breath. What would help a little right now?" })
  }
  try {
    const prompt = `Be brief (<=120 words), empathetic, culturally sensitive, non-judgmental. Start with validation, offer one small action, ask a gentle follow-up.
User: ${text}
Reply:`
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }]}] })
    })
    const j = await r.json()
    const reply = j?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "I'm here with you. Let's take a slow 4-4-6 breath. What tiny step feels doable?"
    res.json({ reply })
  } catch {
    res.json({ reply: "I'm here with you. Deep breath in… hold… and out. What could make this 1% easier?" })
  }
})

// Mood
app.get('/api/mood', async (req, res) => {
  const deviceId = req.query.deviceId
  const userId = await getUserIdFromAuth(req)
  if (!deviceId && !userId) {
    return res.json({ demo: true, items: [
      { id: 'd1', mood: 3, created_at: new Date(Date.now()-86400000*2).toISOString() },
      { id: 'd2', mood: 4, created_at: new Date(Date.now()-86400000).toISOString() },
      { id: 'd3', mood: 3, created_at: new Date().toISOString() },
    ]})
  }
  const match = userId ? { user_id: userId } : { device_id: deviceId }
  const { data, error } = await supabase.from('mood_logs').select('*').match(match).order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data })
})

app.post('/api/mood', async (req, res) => {
  const { mood, deviceId } = req.body || {}
  const userId = await getUserIdFromAuth(req)
  if (!mood || (!deviceId && !userId)) return res.status(400).json({ error: 'mood and deviceId or auth required' })
  const payload = { mood, created_at: new Date().toISOString(), ...(userId ? { user_id: userId } : { device_id: deviceId }) }
  const { data, error } = await supabase.from('mood_logs').insert(payload).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ item: data })
})

app.delete('/api/mood', async (req, res) => {
  const deviceId = req.query.deviceId
  const userId = await getUserIdFromAuth(req)
  if (!deviceId && !userId) return res.status(400).json({ error: 'deviceId or auth required' })
  const match = userId ? { user_id: userId } : { device_id: deviceId }
  const { error } = await supabase.from('mood_logs').delete().match(match)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// Journal
app.get('/api/journal', async (req, res) => {
  const deviceId = req.query.deviceId
  const userId = await getUserIdFromAuth(req)
  if (!deviceId && !userId) {
    return res.json({ demo: true, items: [
      { id: 'j1', content: 'Tried a short walk, felt a little better.', created_at: new Date(Date.now()-86400000).toISOString() },
      { id: 'j2', content: 'Focused breathing before study helped.', created_at: new Date().toISOString(), time_capsule_at: new Date(Date.now()+86400000).toISOString() },
    ]})
  }
  const match = userId ? { user_id: userId } : { device_id: deviceId }
  const { data, error } = await supabase.from('journal_entries').select('*').match(match).order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data })
})

app.post('/api/journal', async (req, res) => {
  const { content, timeCapsuleAt, deviceId } = req.body || {}
  const userId = await getUserIdFromAuth(req)
  if (!content || (!deviceId && !userId)) return res.status(400).json({ error: 'content and deviceId or auth required' })
  const payload = { content, created_at: new Date().toISOString() }
  if (timeCapsuleAt) payload['time_capsule_at'] = timeCapsuleAt
  Object.assign(payload, userId ? { user_id: userId } : { device_id: deviceId })
  const { data, error } = await supabase.from('journal_entries').insert(payload).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ item: data })
})

app.delete('/api/journal', async (req, res) => {
  const deviceId = req.query.deviceId
  const userId = await getUserIdFromAuth(req)
  if (!deviceId && !userId) return res.status(400).json({ error: 'deviceId or auth required' })
  const match = userId ? { user_id: userId } : { device_id: deviceId }
  const { error } = await supabase.from('journal_entries').delete().match(match)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// Pulse
app.get('/api/pulse', async (_req, res) => {
  const { data, error } = await supabase.from('community_mood').select('*').eq('week_id', 'currentWeek').maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.json({ demo: true, byDay: { Mon:3.3, Tue:3.7, Wed:3.5, Thu:3.8, Fri:3.6, Sat:3.4, Sun:3.5 } })
  res.json({ byDay: data.by_day, updatedAt: data.updated_at })
})

// Moderate
app.post('/api/moderate', (req, res) => {
  const { text } = req.body || {}
  const flagged = /(suicide|kill myself|self[- ]?harm|hopeless|panic|can't breathe|hurt myself)/i.test(String(text || ''))
  res.json({ flagged })
})

// AR
app.post('/api/ar', (req, res) => {
  const { latestJournal = '', mood = 3 } = req.body || {}
  const t = String(latestJournal).toLowerCase()
  let scene = 'beach'
  if (/(heat|sun|beach|hot)/.test(t)) scene = 'beach'
  else if (/(quiet|focus|calm)/.test(t) || mood <= 2) scene = 'forest'
  else if (/(goal|climb|challenge|peak)/.test(t)) scene = 'mountain'
  else scene = mood <= 2 ? 'forest' : 'beach'
  res.json({ scene })
})

// Claim device data to authed user
app.post('/api/auth/claim', async (req, res) => {
  const userId = await getUserIdFromAuth(req)
  const { deviceId } = req.body || {}
  if (!userId || !deviceId) return res.status(400).json({ error: 'auth and deviceId required' })
  const { error: e1 } = await supabase.from('mood_logs').update({ user_id: userId, device_id: null }).match({ device_id: deviceId })
  if (e1) return res.status(500).json({ error: e1.message })
  const { error: e2 } = await supabase.from('journal_entries').update({ user_id: userId, device_id: null }).match({ device_id: deviceId })
  if (e2) return res.status(500).json({ error: e2.message })
  res.json({ ok: true })
})

app.listen(PORT, () => console.log('WAVE server listening on', PORT))
