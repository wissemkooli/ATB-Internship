import type { DragEvent } from 'react'
import { CreditCard } from './shared-assets/credit-card/credit-card'
import { formatCardExpiration, formatCardNumber, getCardCompanyLabel, getCardTemplateType } from '../lib/card'
import type { Card } from '../types'

interface CardPreviewProps {
  card: Card
  width?: number
  className?: string
  selected?: boolean
  onClick?: () => void
  onDragStart?: (card: Card) => void
  onDragEnd?: () => void
}

export function CardPreview({
  card,
  width = 316,
  className,
  selected = false,
  onClick,
  onDragStart,
  onDragEnd,
}: CardPreviewProps) {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (!onDragStart) {
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(card.id))
    onDragStart(card)
  }

  return (
    <button
      type="button"
      className={['card-preview', selected ? 'is-active' : '', className ?? ''].filter(Boolean).join(' ')}
      draggable={Boolean(onDragStart)}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <CreditCard
        type={getCardTemplateType(card.card_type)}
        company={getCardCompanyLabel(card.card_type)}
        cardNumber={formatCardNumber(card.card_number)}
        cardHolder={card.cardholder_name.toUpperCase()}
        cardExpiration={formatCardExpiration(card.expiration_date)}
        width={width}
      />
    </button>
  )
}
