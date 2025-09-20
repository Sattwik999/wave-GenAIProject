
import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string
export const supabase = createClient(url, anon)

export async function signInWithGoogle(){
  return await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } })
}
export async function signOut(){ await supabase.auth.signOut() }
export async function getUser(){ const { data } = await supabase.auth.getUser(); return data.user }
