
const BASE = import.meta.env.VITE_API_BASE || '/api'

function headers(token?: string){
  const h: Record<string,string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

export async function apiChat(text:string){ const r = await fetch(`${BASE}/api/chat`.replace('/api/api/','/api/'), { method:'POST', headers:headers(), body:JSON.stringify({text}) }); return (await r.json()).reply }
export async function apiPersonalizedChat(text: string, persona: any, conversationHistory: any[], userProgress?: any){ const r = await fetch(`${BASE}/api/chat/personalized`.replace('/api/api/','/api/'), { method:'POST', headers:headers(), body:JSON.stringify({text, persona, conversationHistory, userProgress}) }); return (await r.json()).reply }
export async function apiTherapeuticFlow(flowId: string, stepId: string, userResponse?: string, persona?: any){ const r = await fetch(`${BASE}/api/therapeutic-flow`.replace('/api/api/','/api/'), { method:'POST', headers:headers(), body:JSON.stringify({flowId, stepId, userResponse, persona}) }); return (await r.json()).guidance }
export async function apiModerate(text:string){ const r = await fetch(`${BASE}/api/moderate`.replace('/api/api/','/api/'), { method:'POST', headers:headers(), body:JSON.stringify({text}) }); return (await r.json()).flagged as boolean }

export async function apiMoodList(deviceId:string, token?:string){ const q = token? '' : `?deviceId=${encodeURIComponent(deviceId)}`; const r = await fetch(`${BASE}/api/mood${q}`.replace('/api/api/','/api/'), { headers:headers(token) }); return await r.json() }
export async function apiMoodAdd(mood:number, deviceId:string, token?:string){ const r = await fetch(`${BASE}/api/mood`.replace('/api/api/','/api/'), { method:'POST', headers:headers(token), body:JSON.stringify({ mood, deviceId }) }); return await r.json() }
export async function apiMoodDeleteAll(deviceId:string, token?:string){ const q = token? '' : `?deviceId=${encodeURIComponent(deviceId)}`; const r = await fetch(`${BASE}/api/mood${q}`.replace('/api/api/','/api/'), { method:'DELETE', headers:headers(token) }); return await r.json() }

export async function apiJournalList(deviceId:string, token?:string){ const q = token? '' : `?deviceId=${encodeURIComponent(deviceId)}`; const r = await fetch(`${BASE}/api/journal${q}`.replace('/api/api/','/api/'), { headers:headers(token) }); return await r.json() }
export async function apiJournalAdd(content:string, timeCapsuleAt:string|null, deviceId:string, token?:string){ const r = await fetch(`${BASE}/api/journal`.replace('/api/api/','/api/'), { method:'POST', headers:headers(token), body:JSON.stringify({ content, timeCapsuleAt, deviceId }) }); return await r.json() }
export async function apiJournalDeleteAll(deviceId:string, token?:string){ const q = token? '' : `?deviceId=${encodeURIComponent(deviceId)}`; const r = await fetch(`${BASE}/api/journal${q}`.replace('/api/api/','/api/'), { method:'DELETE', headers:headers(token) }); return await r.json() }

export async function apiPulse(){ const r = await fetch(`${BASE}/api/pulse`.replace('/api/api/','/api/')); return await r.json() }
export async function apiAR(latestJournal:string, mood:number){ const r = await fetch(`${BASE}/api/ar`.replace('/api/api/','/api/'), { method:'POST', headers:headers(), body:JSON.stringify({ latestJournal, mood }) }); return await r.json() }
export async function apiClaim(deviceId:string, token:string){ const r = await fetch(`${BASE}/api/auth/claim`.replace('/api/api/','/api/'), { method:'POST', headers:headers(token), body:JSON.stringify({ deviceId }) }); return await r.json() }
