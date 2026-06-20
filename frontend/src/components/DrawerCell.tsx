import type { DragEvent } from 'react'
import type { DrawerItem } from '../types'

interface DrawerCellProps {
  row: number
  col: number
  items: DrawerItem[]
  selected: boolean
  onSelectCell: (row: number, col: number) => void
  onMoveItem: (itemId: number, row: number, col: number, order: number) => void
}

export function DrawerCell({
  row,
  col,
  items,
  selected,
  onSelectCell,
  onMoveItem,
}: DrawerCellProps) {
  const isOccupied = items.length > 0

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const itemId = Number(event.dataTransfer.getData('text/plain'))

    if (!Number.isFinite(itemId) || itemId <= 0) {
      return
    }

    const nextOrder = items.some((item) => item.id === itemId) ? items.length : items.length + 1
    onMoveItem(itemId, row, col, nextOrder)
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
        <span
          className={[
            'drawer-cell__status-dot',
            isOccupied ? 'drawer-cell__status-dot--occupied' : 'drawer-cell__status-dot--empty',
          ].join(' ')}
          aria-hidden="true"
        />
      </div>
    </button>
  )
}
