const KEY = 'tostao:token'

type Listener = (token: string | null) => void
const listeners = new Set<Listener>()

let memory: string | null = null

export const session = {
  get(): string | null {
    if (memory) return memory
    try {
      memory = localStorage.getItem(KEY)
    } catch {
      memory = null
    }
    return memory
  },
  set(token: string | null): void {
    memory = token
    try {
      if (token) localStorage.setItem(KEY, token)
      else localStorage.removeItem(KEY)
    } catch {
      return
    } finally {
      listeners.forEach((l) => l(token))
    }
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}
