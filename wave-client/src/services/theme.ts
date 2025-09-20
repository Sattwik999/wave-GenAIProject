
import create from 'zustand'
import { useCallback } from 'react'
type Theme = 'bluey'|'calm'|'neutral'
type Store = { theme:Theme; stigmaShield:boolean; setTheme:(t:Theme)=>void; setShield:(v:boolean)=>void }
export const useThemeStore = create<Store>((set)=>({ 
  theme: (localStorage.getItem('wave-theme') as Theme) || 'bluey',
  stigmaShield: localStorage.getItem('wave-shield') === '1',
  setTheme:(t)=>{ localStorage.setItem('wave-theme', t); set({theme:t}) },
  setShield:(v)=>{ localStorage.setItem('wave-shield', v?'1':'0'); set({stigmaShield:v}) },
}))
export const useTheme = ()=>{
  const { theme, setTheme, stigmaShield, setShield } = useThemeStore()
  const applyTheme = useCallback((t:Theme)=>{ document.documentElement.setAttribute('data-theme', t) },[])
  return { theme, setTheme, stigmaShield, setShield, applyTheme }
}
