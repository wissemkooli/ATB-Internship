import { useAudit, type AuditEntry } from '../context/AuditContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  move:   'Move',
  delete: 'Delete',
  search: 'Search',
  login:  'Login',
  logout: 'Logout',
}

const ACTION_COLORS: Record<string, string> = {
  move:   'var(--accent)',
  delete: 'var(--danger)',
  search: 'var(--muted)',
  login:  '#2563eb',
  logout: 'var(--muted)',
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(date: Date): string {
  const today = new Date()
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  return isToday
    ? `Today, ${formatTime(date)}`
    : `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${formatTime(date)}`
}

// ─── Single log entry ─────────────────────────────────────────────────────────

function LogEntry({ entry }: { entry: AuditEntry }) {
  return (
    <div className="log-entry" style={{ animationDelay: '0ms' }}>
      <div className="card-summary">
        <div className="card-summary__item">
          <span>Operator</span>
          <strong>{entry.operator}</strong>
        </div>
        <div className="card-summary__item" style={{ gridColumn: 'span 2' }}>
          <span>
            <span
              className="log-entry__action-badge"
              style={{ color: ACTION_COLORS[entry.actionType] ?? 'var(--muted)' }}
            >
              {ACTION_LABELS[entry.actionType] ?? entry.actionType}
            </span>
          </span>
          <strong style={{ fontWeight: 500 }}>{entry.description}</strong>
        </div>
      </div>
      <div className="log-entry__meta">{formatDate(entry.timestamp)}</div>
    </div>
  )
}

// ─── ActionLogs ───────────────────────────────────────────────────────────────

export function ActionLogs() {
  const { logs, clearLogs } = useAudit()

  return (
    <div className="board" id="audit-log-panel">
      <div className="board__header">
        <div>
          <div className="board__eyebrow">Activity</div>
          <h3 className="board__title">Audit log</h3>
        </div>
        <div className="board__specs">
          <span>{logs.length} entries</span>
          <button
            type="button"
            className="action-button action-button--danger"
            onClick={clearLogs}
            disabled={logs.length === 0}
            id="clear-audit-log-btn"
          >
            Clear log
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>No activity recorded.</p>
          <span>Actions performed by operators will appear here.</span>
        </div>
      ) : (
        <div className="inspector-stack" style={{ maxHeight: '480px' }}>
          {logs.map((entry) => (
            <div key={entry.id} className="inspector-stack__item">
              <LogEntry entry={entry} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
