import { CardPreview } from './CardPreview'
import { CheckPreview } from './CheckPreview'
import type { Card, Check, Drawer, DrawerItem } from '../types'
import { isCheck } from '../types'

interface SelectionInspectorProps {
  drawer: Drawer | null
  selectedCellKey: string | null
  selectedCellItems: DrawerItem[]
  selectedItem: DrawerItem | null
  selectedItemId: number | null
  onSelectItem: (item: DrawerItem) => void
  onDragItem: (item: DrawerItem | null) => void
  onDeleteItem: (itemId: number) => void
  onAddItemClick: () => void
}

export function SelectionInspector({
  drawer,
  selectedCellKey,
  selectedCellItems,
  selectedItem,
  selectedItemId,
  onSelectItem,
  onDragItem,
  onDeleteItem,
  onAddItemClick,
}: SelectionInspectorProps) {
  const isCheckMode = drawer?.drawer_type === 'checks'
  const itemLabel = isCheckMode ? 'checks' : 'cards'
  const titleLabel = isCheckMode ? 'check' : 'card'

  const renderPreview = (item: DrawerItem, selected = false) => {
    if (isCheck(item)) {
      return (
        <CheckPreview
          check={item as Check}
          selected={selected}
          onClick={() => onSelectItem(item)}
          onDragStart={() => onDragItem(item)}
          onDragEnd={() => onDragItem(null)}
        />
      )
    }

    return (
      <CardPreview
        card={item as Card}
        selected={selected}
        onClick={() => onSelectItem(item)}
        onDragStart={() => onDragItem(item)}
        onDragEnd={() => onDragItem(null)}
      />
    )
  }

  return (
    <aside className="inspector">
      <section className="panel">
        <div className="panel__header">
          <div>
            <div className="panel__eyebrow">Selection</div>
            <h2 className="panel__title">Stack inspector</h2>
          </div>
        </div>

        {selectedCellKey ? (
          <>
            <div className="panel__meta">
              <span>Case {selectedCellKey.replace(':', ' - ')}</span>
              <span>{selectedCellItems.length} {itemLabel}</span>
            </div>

            <div className="inspector-stack">
              {selectedCellItems.length > 0 ? (
                selectedCellItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={[
                      'inspector-stack__card',
                      selectedItemId === item.id ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      position: 'relative',
                      zIndex: index + 1,
                    }}
                  >
                    {renderPreview(item, selectedItemId === item.id)}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No {itemLabel} in this case.</p>
                  <span>Drop a {titleLabel} here to add it to the stack.</span>
                </div>
              )}
              
              <button
                type="button"
                className="action-button"
                onClick={onAddItemClick}
                style={{ marginTop: '10px', width: '100%', borderStyle: 'dashed', background: 'transparent', color: 'var(--text)' }}
              >
                + Add {isCheckMode ? 'Check' : 'Card'} to Case
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a case to inspect its stack.</p>
            <span>The board stays responsive because only the active drawer is rendered.</span>
          </div>
        )}
      </section>

      <section className="panel panel--detail">
        <div className="panel__header">
          <div>
            <div className="panel__eyebrow">{isCheckMode ? 'Check detail' : 'Card detail'}</div>
            <h2 className="panel__title">Active {titleLabel}</h2>
          </div>
          <span className="panel__status">{selectedItem ? `#${selectedItem.order}` : 'Idle'}</span>
        </div>

        {selectedItem ? (
          <>
            {renderPreview(selectedItem)}

            <div className="card-summary">
              <div className="card-summary__item">
                <span>Drawer</span>
                <strong>{drawer?.name ?? '-'}</strong>
              </div>
              <div className="card-summary__item">
                <span>Case</span>
                <strong>
                  {selectedItem.row} / {selectedItem.col}
                </strong>
              </div>
              <div className="card-summary__item">
                <span>Order</span>
                <strong>#{selectedItem.order}</strong>
              </div>
              {isCheck(selectedItem) ? (
                <>
                  <div className="card-summary__item">
                    <span>Client</span>
                    <strong>{selectedItem.client_name}</strong>
                  </div>
                  <div className="card-summary__item">
                    <span>Number</span>
                    <strong>{selectedItem.check_number}</strong>
                  </div>
                  <div className="card-summary__item">
                    <span>Carnet</span>
                    <strong>{selectedItem.carnet_size}</strong>
                  </div>
                  <div className="card-summary__item">
                    <span>Montant</span>
                    <strong>{selectedItem.montant.toFixed(2)} TND</strong>
                  </div>
                </>
              ) : null}
            </div>

            <button
              type="button"
              className="action-button action-button--danger"
              onClick={() => onDeleteItem(selectedItem.id)}
            >
              Delete selected {titleLabel}
            </button>
          </>
        ) : (
          <div className="empty-state">
            <p>No {titleLabel} selected.</p>
            <span>Pick a {titleLabel} from the stack or search results.</span>
          </div>
        )}
      </section>
    </aside>
  )
}
