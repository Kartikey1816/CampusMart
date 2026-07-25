import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { AuthContext } from './authContext'
const storageKey = 'campusmart_session'

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(Boolean(session?.token))
  const sessionToken = session?.token

  const saveSession = (nextSession) => {
    setSession(nextSession)
    if (nextSession) localStorage.setItem(storageKey, JSON.stringify(nextSession))
    else localStorage.removeItem(storageKey)
  }

  useEffect(() => {
    if (!sessionToken) { setIsLoading(false); return }
    api('/auth/me', { token: sessionToken })
      .then(({ user }) => saveSession({ token: sessionToken, user }))
      .catch(() => saveSession(null))
      .finally(() => setIsLoading(false))
  }, [sessionToken])

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    saveSession({ token: data.token, user: data.user })
    return data.user
  }
  const logout = () => saveSession(null)
  const updateUser = (user) => saveSession(session ? { ...session, user: { ...session.user, ...user } } : null)

  return <AuthContext.Provider value={{ user: session?.user || null, token: session?.token || null, isLoading, login, logout, updateUser }}>{children}</AuthContext.Provider>
}
export { AuthProvider }
