import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'
import { session } from '@/lib/session'
import type { AuthResult } from '@/lib/types'
import { AuthContext, type AuthContextValue } from './context'
import { useEventStream } from '@/lib/useEventStream'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => session.get())
  const [redirectTo, setRedirectTo] = useState('/')

  useEffect(() => session.subscribe(setToken), [])

  const me = useQuery({ queryKey: qk.me, queryFn: authApi.me, enabled: !!token, staleTime: Infinity })

  useEventStream(token)

  const signIn = useCallback(
    (result: AuthResult, next = '/') => {
      queryClient.clear()
      setRedirectTo(next)
      queryClient.setQueryData(qk.me, result.user)
      session.set(result.accessToken)
    },
    [queryClient]
  )

  const signOut = useCallback(() => {
    session.set(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ user: token ? (me.data ?? null) : null, token, loading: !!token && me.isPending, redirectTo, signIn, signOut }),
    [token, me.data, me.isPending, redirectTo, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
