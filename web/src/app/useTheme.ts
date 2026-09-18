import { useCallback, useState } from 'react'

export function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('tostao:theme', next ? 'dark' : 'light')
    } catch {
      return
    }
    setDark(next)
  }, [])
  return [dark, toggle]
}
