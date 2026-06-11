import { useEffect, useState } from 'react'
import { authApi, type OperatorRecord } from '../lib/authApi'
import { ActionLogs } from './ActionLogs'

// ─── Operators Panel ──────────────────────────────────────────────────────────

function OperatorsPanel() {
  const [operators, setOperators] = useState<OperatorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    authApi
      .getOperators()
      .then((data) => {
        if (isMounted) setOperators(data)
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load operators')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const toggleStatus = async (username: string) => {
    try {
      const updatedOp = await authApi.toggleOperatorStatus(username)
      setOperators((prev) => prev.map((op) => (op.username === username ? updatedOp : op)))
    } catch (err) {
      console.error('Failed to toggle status:', err)
      // Could show a toast here
    }
  }

  return (
    <div className="board" id="operators-panel">
      <div className="board__header">
        <div>
          <div className="board__eyebrow">Access management</div>
          <h3 className="board__title">Registered operators</h3>
        </div>
        <div className="board__specs">
          <span>{operators.filter((o) => o.status === 'active').length} active</span>
          <span>{operators.length} total</span>
        </div>
      </div>

      {loading ? (
        <div className="status-panel">Loading operators…</div>
      ) : error ? (
        <div className="status-panel status-panel--error">{error}</div>
      ) : (
        <div className="operator-list">
          {/* Header row */}
          <div className="operator-row operator-row--header">
            <span className="app-brand__eyebrow">Operator</span>
            <span className="app-brand__eyebrow">Username</span>
            <span className="app-brand__eyebrow">Status</span>
            <span className="app-brand__eyebrow" style={{ textAlign: 'right' }}>
              Actions
            </span>
          </div>

          {operators.map((op) => (
            <div key={op.username} className="operator-row">
              {/* Display name */}
              <div className="card-summary__item" style={{ border: 'none', background: 'none', padding: '0' }}>
                <span>Display name</span>
                <strong>{op.displayName}</strong>
              </div>

              {/* Username */}
              <div className="card-summary__item" style={{ border: 'none', background: 'none', padding: '0' }}>
                <span>Username</span>
                <strong style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  {op.username}
                </strong>
              </div>

              {/* Status badge */}
              <div>
                <span
                  className={[
                    'badge',
                    op.status === 'active' ? 'badge--active' : 'badge--revoked',
                  ].join(' ')}
                >
                  {op.status === 'active' ? 'Active' : 'Revoked'}
                </span>
              </div>

              {/* Action button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  id={`operator-toggle-${op.username}`}
                  className={[
                    'action-button',
                    op.status === 'active' ? 'action-button--danger' : '',
                  ].join(' ')}
                  onClick={() => toggleStatus(op.username)}
                >
                  {op.status === 'active' ? 'Revoke access' : 'Restore access'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <OperatorsPanel />
      <ActionLogs />
    </div>
  )
}
