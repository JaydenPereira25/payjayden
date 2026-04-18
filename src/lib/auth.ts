import { useEffect, useState, useCallback } from 'react'
import {
  getUser,
  onAuthChange,
  AUTH_EVENTS,
  handleAuthCallback,
  AuthError,
} from '@netlify/identity'
import type { User } from '@netlify/identity'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const current = await getUser()
      setUser(current)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const callbackResult = await handleAuthCallback()
        if (callbackResult && mounted) {
          if ('user' in callbackResult && callbackResult.user) {
            setUser(callbackResult.user)
          }
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search)
          }
        }
      } catch (err) {
        if (!(err instanceof AuthError)) {
          console.error(err)
        }
      }
      if (mounted) await refresh()
    })()

    const unsub = onAuthChange((event, u) => {
      if (event === AUTH_EVENTS.LOGIN || event === AUTH_EVENTS.USER_UPDATED || event === AUTH_EVENTS.TOKEN_REFRESH) {
        setUser(u ?? null)
      } else if (event === AUTH_EVENTS.LOGOUT) {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [refresh])

  return { user, loading, refresh }
}
