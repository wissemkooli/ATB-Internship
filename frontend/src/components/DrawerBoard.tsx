import { useMemo } from 'react'
import type { Card, Drawer } from '../types'
import { DrawerCell } from './DrawerCell'

interface DrawerBoardProps {
  drawer: Drawer
  cards: Card[]
  selectedCellKey: string | null
  onSelectCell: (row: number, col: number) => void
  onMoveCard: (cardId: number, row: number, col: number, order: number) => void
}

export function DrawerBoard({
  drawer,
  cards,
  selectedCellKey,
  onSelectCell,
  onMoveCard,
}: DrawerBoardProps) {
  const columns = useMemo(
    () => Array.from({ length: drawer.cols }, (_, index) => index + 1),
    [drawer.cols],
  )

  const rows = useMemo(
    () => Array.from({ length: drawer.rows }, (_, index) => index + 1),
    [drawer.rows],
  )

  const cardsByCell = useMemo(() => {
    const grouped = new Map<string, Card[]>()

    for (const card of cards) {
      const key = `${card.row}:${card.col}`
      const bucket = grouped.get(key)
      if (bucket) {
        bucket.push(card)
      } else {
        grouped.set(key, [card])
      }
    }

    for (const bucket of grouped.values()) {
      bucket.sort((left, right) => left.order - right.order)
    }

    return grouped
  }, [cards])

  return (
    <div className="board">
      <div className="board__header">
        <div>
          <div className="board__eyebrow">Active drawer</div>
          <h2 className="board__title">{drawer.name}</h2>
        </div>
        <div className="board__specs">
          <span>{drawer.rows} rows</span>
          <span>{drawer.cols} columns</span>
          <span>{cards.length} cards</span>
        </div>
      </div>

      <div className="board__matrix">
        <div
          className="board__column-headers"
          style={{
            gridTemplateColumns: `56px repeat(${drawer.cols}, minmax(0, 1fr))`,
          }}
        >
          <div className="board__corner" aria-hidden="true" />
          {columns.map((col) => (
            <div key={col} className="board__axis board__axis--top">
              {col}
            </div>
          ))}
        </div>

        <div className="board__rows">
          {rows.map((row) => (
            <div
              key={row}
              className="board__row"
              style={{
                gridTemplateColumns: `56px repeat(${drawer.cols}, minmax(0, 1fr))`,
              }}
            >
              <div className="board__axis board__axis--left">{row}</div>

              {columns.map((col) => {
                const cellKey = `${row}:${col}`
                const cellCards = cardsByCell.get(cellKey) ?? []

                return (
                  <DrawerCell
                    key={cellKey}
                    row={row}
                    col={col}
                    cards={cellCards}
                    selected={selectedCellKey === cellKey}
                    onSelectCell={onSelectCell}
                    onMoveCard={onMoveCard}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
