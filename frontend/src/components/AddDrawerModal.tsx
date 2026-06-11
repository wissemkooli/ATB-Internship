import { useState } from 'react'

interface AddDrawerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, rows: number, cols: number) => Promise<void>
}

export function AddDrawerModal({ isOpen, onClose, onSubmit }: AddDrawerModalProps) {
  const [name, setName] = useState('')
  const [rows, setRows] = useState(5)
  const [cols, setCols] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(name, rows, cols)
      setName('')
      setRows(5)
      setCols(5)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add drawer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Add new drawer</h2>
          <button type="button" className="modal__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <div className="login-form__error" style={{ color: 'var(--danger)', background: 'rgba(180, 35, 24, 0.08)', borderColor: 'rgba(180, 35, 24, 0.16)' }}>{error}</div>}
            <div className="modal-form__field">
              <label className="modal-form__label">Drawer Name</label>
              <input
                type="text"
                className="modal-form__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Cabinet A"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Rows</label>
              <input
                type="number"
                className="modal-form__input"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                required
                min={1}
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Columns</label>
              <input
                type="number"
                className="modal-form__input"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                required
                min={1}
              />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="action-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="action-button" style={{ background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Drawer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
