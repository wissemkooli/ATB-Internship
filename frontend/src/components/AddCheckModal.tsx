import { useState } from 'react'
import type { CarnetSize } from '../types'

interface AddCheckModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (clientName: string, checkNumber: string, montant: number, carnetSize: CarnetSize) => Promise<void>
  drawerName: string
  row: number
  col: number
}

export function AddCheckModal({ isOpen, onClose, onSubmit, drawerName, row, col }: AddCheckModalProps) {
  const [clientName, setClientName] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [montant, setMontant] = useState('')
  const [carnetSize, setCarnetSize] = useState<CarnetSize>('25')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSubmit(clientName, checkNumber, Number(montant), carnetSize)
      setClientName('')
      setCheckNumber('')
      setMontant('')
      setCarnetSize('25')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add check')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Add check to stack</h2>
          <button type="button" className="modal__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <div className="login-form__error" style={{ color: 'var(--danger)', background: 'rgba(180, 35, 24, 0.08)', borderColor: 'rgba(180, 35, 24, 0.16)' }}>{error}</div>}

            <div className="card-summary" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="card-summary__item">
                <span>Destination</span>
                <strong>{drawerName}</strong>
              </div>
              <div className="card-summary__item">
                <span>Case</span>
                <strong>{row} / {col}</strong>
              </div>
            </div>

            <div className="modal-form__field">
              <label className="modal-form__label">Client Name</label>
              <input
                type="text"
                className="modal-form__input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="Client name"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Check Number</label>
              <input
                type="text"
                className="modal-form__input"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                required
                placeholder="000000"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Montant</label>
              <input
                type="number"
                className="modal-form__input"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                required
                min={0}
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Carnet Size</label>
              <select
                className="modal-form__select"
                value={carnetSize}
                onChange={(e) => setCarnetSize(e.target.value as CarnetSize)}
              >
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="action-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="action-button" style={{ background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Check'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
