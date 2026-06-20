import { useMemo } from 'react'
import type { Drawer, DrawerItem } from '../types'
import { DrawerCell } from './DrawerCell'

interface DrawerBoardProps {
  drawer: Drawer
  items: DrawerItem[]
  selectedCellKey: string | null
  onSelectCell: (row: number, col: number) => void
  onMoveItem: (itemId: number, row: number, col: number, order: number) => void
}

const getColumnLabel = (index: number) => {
  let value = index
  let label = ''

  while (value > 0) {
    value -= 1
    label = String.fromCharCode(65 + (value % 26)) + label
    value = Math.floor(value / 26)
  }

  return label
}

export function DrawerBoard({
  drawer,
  items,
  selectedCellKey,
  onSelectCell,
  onMoveItem,
}: DrawerBoardProps) {
  const columns = useMemo(
    () => Array.from({ length: drawer.cols }, (_, index) => index + 1),
    [drawer.cols],
  )

  const columnLabels = useMemo(
    () => columns.map((col) => getColumnLabel(col)),
    [columns],
  )

  const rows = useMemo(
    () => Array.from({ length: drawer.rows }, (_, index) => index + 1),
    [drawer.rows],
  )

  const itemsByCell = useMemo(() => {
    const grouped = new Map<string, DrawerItem[]>()

    for (const item of items) {
      const key = `${item.row}:${item.col}`
      const bucket = grouped.get(key)
      if (bucket) {
        bucket.push(item)
      } else {
        grouped.set(key, [item])
      }
    }

    for (const bucket of grouped.values()) {
      bucket.sort((left, right) => left.order - right.order)
    }

    return grouped
  }, [items])

  const itemLabel = drawer.drawer_type === 'checks' ? 'checks' : 'cards'

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
          <span>{items.length} {itemLabel}</span>
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
          {columns.map((col, index) => (
            <div key={col} className="board__axis board__axis--top">
              {columnLabels[index]}
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
                const cellItems = itemsByCell.get(cellKey) ?? []

                return (
                  <DrawerCell
                    key={cellKey}
                    row={row}
                    col={col}
                    items={cellItems}
                    selected={selectedCellKey === cellKey}
                    onSelectCell={onSelectCell}
                    onMoveItem={onMoveItem}
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
