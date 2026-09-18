import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentMonth } from '@/lib/dates'

export function useMonth(): [string, (month: string) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('mes')
  const month = raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : currentMonth()
  const setMonth = useCallback(
    (next: string) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set('mes', next)
          return p
        },
        { replace: true }
      ),
    [setParams]
  )
  return [month, setMonth]
}
