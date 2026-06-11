import { useState } from 'react'
import type { CardType } from '../types'

interface AddCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (cardholder_name: string, card_number: string, expiration_date: string, card_type: CardType) => Promise<void>
  drawerName: string
  row: number
  col: number
}

export function AddCardModal({ isOpen, onClose, onSubmit, drawerName, row, col }: AddCardModalProps) {
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [cardType, setCardType] = useState<CardType>('visa')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(cardholderName, cardNumber, expirationDate, cardType)
      setCardholderName('')
      setCardNumber('')
      setExpirationDate('')
      setCardType('visa')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Add card to stack</h2>
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
              <label className="modal-form__label">Cardholder Name</label>
              <input
                type="text"
                className="modal-form__input"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Card Number</label>
              <input
                type="text"
                className="modal-form__input"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                placeholder="4000 1234 5678 9010"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Expiration Date</label>
              <input
                type="text"
                className="modal-form__input"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
                placeholder="12/25"
              />
            </div>
            <div className="modal-form__field">
              <label className="modal-form__label">Card Type</label>
              <select
                className="modal-form__select"
                value={cardType}
                onChange={(e) => setCardType(e.target.value as CardType)}
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
              </select>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="action-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="action-button" style={{ background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
