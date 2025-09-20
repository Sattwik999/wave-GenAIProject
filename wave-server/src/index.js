
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

app.post('/api/chat/personalized', async (req, res) => {
  const { text, persona, conversationHistory, userProgress } = req.body || {}
  if (!text || !persona) return res.status(400).json({ error: 'text and persona required' })
  
  if (!GEMINI_API_KEY) {
    return res.json({ reply: "I'm here for you, but I need my AI connection to give you the personalized response you deserve." })
  }

  try {
    // Build context from conversation history
    let conversationContext = ""
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = conversationHistory.slice(-6).map(msg => 
        `${msg.sender === 'user' ? 'You' : persona.name || 'I'}: ${msg.text}`
      ).join('\n') + '\n'
    }

    // Add therapeutic context if available
    let therapeuticContext = ""
    if (userProgress) {
      therapeuticContext = `\nTHERAPEUTIC CONTEXT:
- Recent mood trend: ${userProgress.moodTrend || 'unknown'}
- Emotional categories: ${userProgress.emotionalCategories?.join(', ') || 'none detected'}
- Coping strategies used: ${userProgress.copingStrategies?.join(', ') || 'none noted'}
- Risk level: ${userProgress.riskLevel || 'unknown'}
`
    }

    // Detect emotional state for therapeutic suggestions
    const emotionalKeywords = {
      anxiety: /anxious|worried|nervous|panic|overwhelm|stress/i,
      depression: /sad|down|depressed|hopeless|empty|worthless/i,
      crisis: /suicid|harm|hurt myself|end it all|no point living/i
    }

    let therapeuticSuggestion = ""
    
    if (emotionalKeywords.crisis.test(text)) {
      therapeuticSuggestion = "\nIMMEDIATE SUPPORT NEEDED: If you're having thoughts of self-harm, please reach out to a crisis hotline immediately."
    } else if (emotionalKeywords.anxiety.test(text)) {
      therapeuticSuggestion = "\nTHERAPEUTIC SUGGESTION: Consider guiding them through a brief grounding technique (5-4-3-2-1 sensory method) or box breathing if appropriate."
    } else if (emotionalKeywords.depression.test(text)) {
      therapeuticSuggestion = "\nTHERAPEUTIC SUGGESTION: Consider behavioral activation - suggest one small, meaningful activity they could do today."
    }

    // Create persona-specific prompt with therapeutic integration
    const relationshipContext = {
      parent: "You are their loving, supportive parent who has watched them grow up. You know their strengths and challenges. You speak with warmth, wisdom, and unconditional love. As a parent, you naturally want to guide them toward healthy coping strategies.",
      friend: "You are their close friend who knows them well. You share experiences, inside jokes, and mutual support. You speak casually, supportively, and with genuine care. As a friend, you can suggest coping strategies in a natural, non-clinical way.",
      partner: "You are their romantic partner who loves them deeply. You share an intimate bond, dreams, and daily life. You speak with love, tenderness, and understanding. You naturally want to support their mental health and wellbeing.",
      grandparent: "You are their wise, loving grandparent with years of life experience. You offer gentle guidance, timeless wisdom, and unconditional love. Your life experience gives you natural wisdom about coping with difficulties.",
      mentor: "You are their trusted mentor who guides their growth. You offer professional wisdom, encouragement, and insightful questions to help them develop. You naturally incorporate evidence-based approaches in your guidance."
    }

    const personalityTraits = persona.personality?.traits?.join(', ') || 'caring and supportive'
    const catchphrases = persona.personality?.catchphrases?.join(', ') || ''
    const communicationStyle = persona.personality?.communicationStyle || 'warm'

    const prompt = `You are roleplaying as ${persona.name || 'someone close'}, their ${persona.relationship}. 

PERSONALITY CONTEXT:
${relationshipContext[persona.relationship] || relationshipContext.friend}

CHARACTER TRAITS: ${personalityTraits}
COMMUNICATION STYLE: ${communicationStyle}
${catchphrases ? `CATCHPHRASES TO USE NATURALLY: ${catchphrases}` : ''}

CONVERSATION HISTORY:
${conversationContext}

${therapeuticContext}

${therapeuticSuggestion}

THERAPEUTIC GUIDELINES:
- If they express anxiety: You might naturally suggest breathing together, grounding techniques, or remind them of their past successes
- If they express sadness/depression: You might encourage small positive activities, validate their feelings, and remind them of their strengths
- If they're stressed: You might suggest taking breaks, perspective-taking, or stress management techniques that fit your relationship
- Always prioritize emotional safety and suggest professional help if concerning patterns emerge

RESPONSE GUIDELINES:
- Stay completely in character as their ${persona.relationship}
- Use a ${communicationStyle} tone that matches this relationship
- Reference your shared relationship naturally 
- Be emotionally supportive but authentic to this relationship type
- Naturally weave in therapeutic suggestions as this person would
- Keep responses conversational (80-150 words)
- Respond to their emotional state appropriately
- ${catchphrases ? 'Weave in catchphrases naturally when they fit' : ''}

Current message from them: "${text}"

Respond as ${persona.name || 'their ' + persona.relationship}, incorporating natural therapeutic support that fits your relationship:`

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 200
        }
      })
    })
    
    const j = await r.json()
    const reply = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      ?? `I'm here for you, and I care about what you're going through. Tell me more about how you're feeling.`
    
    res.json({ reply })
  } catch (error) {
    console.error('Personalized chat error:', error)
    res.json({ reply: `I'm here for you. Sometimes my connection gets a bit fuzzy, but my care for you never does. What's on your mind?` })
  }
})

// New endpoint for therapeutic flow guidance
app.post('/api/therapeutic-flow', async (req, res) => {
  const { flowId, stepId, userResponse, persona } = req.body || {}
  if (!flowId || !stepId) return res.status(400).json({ error: 'flowId and stepId required' })
  
  if (!GEMINI_API_KEY) {
    return res.json({ reply: "I need my AI connection to guide you through this therapeutic exercise." })
  }

  try {
    const prompt = `You are guiding someone through a mental health therapeutic exercise.

THERAPEUTIC CONTEXT:
- Flow: ${flowId}
- Current step: ${stepId}
- Their response: "${userResponse || 'No response yet'}"
- Persona context: ${persona ? `Speaking as their ${persona.relationship} (${persona.name})` : 'Professional therapeutic guide'}

GUIDELINES:
- Use evidence-based therapeutic techniques (CBT, mindfulness, behavioral activation)
- Be encouraging and validating
- Ask thoughtful follow-up questions
- Provide gentle guidance toward insights
- Keep responses focused and therapeutic (100-150 words)
- ${persona ? `Speak as their ${persona.relationship} would, but with therapeutic knowledge` : 'Use a professional but warm tone'}

Provide the next step in their therapeutic journey, responding to their input and guiding them forward:`

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 200
        }
      })
    })
    
    const j = await r.json()
    const guidance = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      ?? "Let's take this one step at a time. How are you feeling about what we've discussed so far?"
    
    res.json({ guidance })
  } catch (error) {
    console.error('Therapeutic flow error:', error)
    res.json({ guidance: "I'm here to support you through this. Let's continue step by step." })
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
