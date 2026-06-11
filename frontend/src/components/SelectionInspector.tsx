import { CardPreview } from './CardPreview'
import type { Card, Drawer } from '../types'

interface SelectionInspectorProps {
  drawer: Drawer | null
  selectedCellKey: string | null
  selectedCellCards: Card[]
  selectedCard: Card | null
  selectedCardId: number | null
  onSelectCard: (card: Card) => void
  onDragCard: (card: Card | null) => void
  onDeleteCard: (cardId: number) => void
  onAddCardClick: () => void
}

export function SelectionInspector({
  drawer,
  selectedCellKey,
  selectedCellCards,
  selectedCard,
  selectedCardId,
  onSelectCard,
  onDragCard,
  onDeleteCard,
  onAddCardClick,
}: SelectionInspectorProps) {
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
              <span>{selectedCellCards.length} cards</span>
            </div>

            <div className="inspector-stack">
              {selectedCellCards.length > 0 ? (
                selectedCellCards.map((card, index) => (
                  <div
                    key={card.id}
                    className={[
                      'inspector-stack__card',
                      selectedCardId === card.id ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      position: 'relative',
                      zIndex: index + 1,
                    }}
                  >
                    <CardPreview
                      card={card}
                      selected={selectedCardId === card.id}
                      onClick={() => onSelectCard(card)}
                      onDragStart={() => onDragCard(card)}
                      onDragEnd={() => onDragCard(null)}
                    />
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No cards in this case.</p>
                  <span>Drop a card here to add it to the stack.</span>
                </div>
              )}
              
              <button
                type="button"
                className="action-button"
                onClick={onAddCardClick}
                style={{ marginTop: '10px', width: '100%', borderStyle: 'dashed', background: 'transparent', color: 'var(--text)' }}
              >
                + Add Card to Case
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
            <div className="panel__eyebrow">Card detail</div>
            <h2 className="panel__title">Active card</h2>
          </div>
          <span className="panel__status">{selectedCard ? `#${selectedCard.order}` : 'Idle'}</span>
        </div>

        {selectedCard ? (
          <>
            <CardPreview
              card={selectedCard}
              onDragStart={() => onDragCard(selectedCard)}
              onDragEnd={() => onDragCard(null)}
            />

            <div className="card-summary">
              <div className="card-summary__item">
                <span>Drawer</span>
                <strong>{drawer?.name ?? '-'}</strong>
              </div>
              <div className="card-summary__item">
                <span>Case</span>
                <strong>
                  {selectedCard.row} / {selectedCard.col}
                </strong>
              </div>
              <div className="card-summary__item">
                <span>Order</span>
                <strong>#{selectedCard.order}</strong>
              </div>
            </div>

            <button
              type="button"
              className="action-button action-button--danger"
              onClick={() => onDeleteCard(selectedCard.id)}
            >
              Delete selected card
            </button>
          </>
        ) : (
          <div className="empty-state">
            <p>No card selected.</p>
            <span>Pick a card from the stack or search results.</span>
          </div>
        )}
      </section>
    </aside>
  )
}
