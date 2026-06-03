import type { DragEvent } from 'react'
import type { Card } from '../types'

interface DrawerCellProps {
  row: number
  col: number
  cards: Card[]
  selected: boolean
  onSelectCell: (row: number, col: number) => void
  onMoveCard: (cardId: number, row: number, col: number, order: number) => void
}

export function DrawerCell({
  row,
  col,
  cards,
  selected,
  onSelectCell,
  onMoveCard,
}: DrawerCellProps) {
  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const cardId = Number(event.dataTransfer.getData('text/plain'))

    if (!Number.isFinite(cardId) || cardId <= 0) {
      return
    }

    const nextOrder = cards.some((card) => card.id === cardId) ? cards.length : cards.length + 1
    onMoveCard(cardId, row, col, nextOrder)
  }

  return (
    <button
      type="button"
      className={['drawer-cell', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
      onClick={() => onSelectCell(row, col)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="drawer-cell__frame">
        {cards.length > 0 ? (
          <span className="drawer-cell__count" aria-label={`${cards.length} cards`}>
            {cards.length}
          </span>
        ) : null}
      </div>
    </button>
  )
}
