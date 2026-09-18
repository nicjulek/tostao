import { createContext, useContext } from 'react'
import type { AuthResult, User } from '@/lib/types'

export interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  redirectTo: string
  signIn: (result: AuthResult, redirectTo?: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
