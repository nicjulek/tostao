import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_URL } from './api'
import { qk } from './queryKeys'
import type { ImportProgress, Notification } from './types'

type ProgressListener = (p: ImportProgress) => void
const progressListeners = new Set<ProgressListener>()

export function onImportProgress(listener: ProgressListener): () => void {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

export function useEventStream(token: string | null): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || typeof EventSource === 'undefined') return
    const source = new EventSource(`${API_URL}/stream?token=${encodeURIComponent(token)}`)

    source.addEventListener('import', (e) => {
      const progress = JSON.parse((e as MessageEvent).data) as ImportProgress
      progressListeners.forEach((l) => l(progress))
      if (progress.stage === 'done' || progress.stage === 'failed') {
        void queryClient.invalidateQueries({ queryKey: qk.imports })
        void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
        void queryClient.invalidateQueries({ queryKey: qk.reports })
        void queryClient.invalidateQueries({ queryKey: qk.accounts })
      }
    })

    source.addEventListener('notification', (e) => {
      const n = JSON.parse((e as MessageEvent).data) as Notification
      toast(n.title, { description: n.body })
      void queryClient.invalidateQueries({ queryKey: qk.notifications })
    })

    return () => source.close()
  }, [token, queryClient])
}
