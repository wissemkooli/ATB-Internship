import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../lib/authApi'
import { useAuth } from './AuthContext'

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuditActionType = 'move' | 'delete' | 'search' | 'login' | 'logout' | 'create'

export interface AuditEntry {
  id: number
  operator: string
  actionType: AuditActionType
  description: string
  timestamp: Date
}

interface AuditContextValue {
  logs: AuditEntry[]
  addLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
  clearLogs: () => void
  loading: boolean
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuditContext = createContext<AuditContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch logs when an admin logs in
  useEffect(() => {
    if (user?.role === 'admin') {
      let isMounted = true
      setLoading(true)
      authApi
        .getAuditLogs()
        .then((data) => {
          if (isMounted) setLogs(data)
        })
        .catch((err) => console.error('Failed to load audit logs:', err))
        .finally(() => {
          if (isMounted) setLoading(false)
        })
      return () => {
        isMounted = false
      }
    } else {
      // Clear logs if not admin
      setLogs([])
    }
  }, [user?.role])

  const addLog = useCallback(async (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    try {
      // Optimistic update
      const tempId = -Date.now()
      const newEntry: AuditEntry = { ...entry, id: tempId, timestamp: new Date() }
      setLogs((prev) => [newEntry, ...prev])

      // Actual backend call
      const savedEntry = await authApi.addAuditLog(entry)
      
      // Replace optimistic entry with saved entry (which has real ID and timestamp)
      setLogs((prev) => prev.map((l) => (l.id === tempId ? savedEntry : l)))
    } catch (err) {
      console.error('Failed to save audit log:', err)
      // Ideally, we'd remove the optimistic update here on failure
    }
  }, [])

  const clearLogs = useCallback(async () => {
    try {
      await authApi.clearAuditLogs()
      setLogs([])
    } catch (err) {
      console.error('Failed to clear audit logs:', err)
    }
  }, [])

  return (
    <AuditContext.Provider value={{ logs, addLog, clearLogs, loading }}>
      {children}
    </AuditContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudit(): AuditContextValue {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error('useAudit must be used inside <AuditProvider>')
  return ctx
}
