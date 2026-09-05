import type { Metric } from 'web-vitals'
import { API_URL } from './api'

interface TelemetryEvent {
  kind: 'web-vital' | 'error' | 'event'
  name: string
  value?: number
  rating?: string
  message?: string
  path?: string
}

const queue: TelemetryEvent[] = []
let timer: ReturnType<typeof setTimeout> | undefined

function flush(): void {
  if (!queue.length) return
  const body = JSON.stringify({ events: queue.splice(0, 50) })
  const url = `${API_URL}/telemetry`
  const sent = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
  if (!sent)
    void fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => undefined)
}

export function track(event: TelemetryEvent): void {
  if (import.meta.env.MODE === 'test') return
  queue.push({ ...event, path: event.path ?? location.pathname })
  clearTimeout(timer)
  timer = setTimeout(flush, 4000)
}

export function reportError(error: unknown, name = 'unhandled'): void {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}`.slice(0, 2000) : String(error).slice(0, 2000)
  track({ kind: 'error', name, message })
}

export async function startTelemetry(): Promise<void> {
  window.addEventListener('error', (e) => reportError(e.error ?? e.message, 'window.error'))
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'unhandledrejection'))
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
  const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals')
  const send = (m: Metric) => track({ kind: 'web-vital', name: m.name, value: Math.round(m.value * 1000) / 1000, rating: m.rating })
  onCLS(send)
  onINP(send)
  onLCP(send)
  onFCP(send)
  onTTFB(send)
}
