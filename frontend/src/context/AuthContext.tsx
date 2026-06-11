import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../lib/authApi'

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'operator'

export interface AuthUser {
  username: string
  role: UserRole
  displayName: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const STORAGE_KEY_USER = 'atb_auth_user'
const STORAGE_KEY_TOKEN = 'atb_auth_token'

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER)
      return stored ? (JSON.parse(stored) as AuthUser) : null
    } catch {
      return null
    }
  })

  // We could verify the token on mount here, but relying on the cached
  // user profile is fine for a basic setup. If API calls fail with 401 later,
  // we could catch them and force a logout.

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY_USER)
      localStorage.removeItem(STORAGE_KEY_TOKEN)
    }
  }, [user])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password)
      
      // Save token for future API calls
      localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token)
      
      // Update local state
      setUser({
        username: response.user.username,
        role: response.user.role,
        displayName: response.user.displayName,
      })
      
      return true
    } catch (err) {
      console.error('Login failed:', err)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
