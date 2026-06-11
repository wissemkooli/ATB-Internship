import { useMemo, useState } from 'react'
import { DrawerBoard } from './components/DrawerBoard'
import { AtbLogo } from './components/AtbLogo'
import { DrawerTabs } from './components/DrawerTabs'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { SelectionInspector } from './components/SelectionInspector'
import { useCardSearch } from './hooks/useCardSearch'
import { useDrawerCards } from './hooks/useDrawerCards'
import { useDrawers } from './hooks/useDrawers'
import { cellKey, type Card, type SearchResultCard } from './types'
import { api } from './lib/api'
import './App.css'

function App() {
  const {
    drawers,
    selectedDrawer,
    selectedDrawerId,
    loading: drawersLoading,
    error: drawersError,
    selectDrawer,
  } = useDrawers()
  const {
    cards,
    cardsByCell,
    loading: cardsLoading,
    error: cardsError,
    getCardById,
    moveCard,
    deleteCard,
  } = useDrawerCards(selectedDrawerId)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { results: searchResults, loading: searchLoading, error: searchError } = useCardSearch(
    searchQuery,
    drawers,
  )

  const selectedCellCards = useMemo(() => {
    if (!selectedCellKey) {
      return []
    }

    return cardsByCell.get(selectedCellKey) ?? []
  }, [cardsByCell, selectedCellKey])

  const selectedCard = useMemo(() => {
    if (selectedCardId === null) {
      return null
    }

    return cards.find((card) => card.id === selectedCardId) ?? null
  }, [cards, selectedCardId])

  const handleSelectCell = (row: number, col: number) => {
    const nextCellKey = cellKey(row, col)

    api.highlightCompartment(row, col).catch((err) => {
      console.error('Failed to highlight compartment:', err)
    })

    if (selectedCellKey === nextCellKey) {
      setSelectedCellKey(null)
      setSelectedCardId(null)
      return
    }

    const nextCards = cardsByCell.get(nextCellKey) ?? []
    const nextSelectedCard = nextCards[nextCards.length - 1] ?? null

    setSelectedCellKey(nextCellKey)
    setSelectedCardId(nextSelectedCard?.id ?? null)
  }

  const handleSelectCard = (card: Card) => {
    setSelectedCellKey(cellKey(card.row, card.col))
    setSelectedCardId(card.id)
  }

  const handleSelectSearchResult = (card: SearchResultCard) => {
    api.highlightCard(card.id).catch((err) => {
      console.error('Failed to highlight card:', err)
    })

    selectDrawer(card.drawer_id)
    setSelectedCellKey(cellKey(card.row, card.col))
    setSelectedCardId(card.id)
    setSearchQuery('')
  }

  const handleMoveCard = async (cardId: number, row: number, col: number, order: number) => {
    if (selectedDrawerId === null) {
      return
    }

    setActionError(null)

    try {
      const updatedCard = await moveCard(cardId, {
        row,
        col,
        order,
        drawer_id: selectedDrawerId,
      })

      if (updatedCard) {
        setSelectedCellKey(cellKey(updatedCard.row, updatedCard.col))
        setSelectedCardId(updatedCard.id)
      }
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : 'Unable to move card',
      )
    }
  }

  const handleDeleteCard = async (cardId: number) => {
    const card = getCardById(cardId) ?? selectedCard
    const cardCellKey = card ? cellKey(card.row, card.col) : null
    const wasSelected = selectedCardId === cardId

    setActionError(null)

    try {
      await deleteCard(cardId)

      if (wasSelected && cardCellKey) {
        const remainingCards = cards
          .filter((candidate) => candidate.id !== cardId)
          .filter((candidate) => cellKey(candidate.row, candidate.col) === cardCellKey)
        const nextCard = remainingCards[remainingCards.length - 1] ?? null

        setSelectedCellKey(cardCellKey)
        setSelectedCardId(nextCard?.id ?? null)
      }
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : 'Unable to delete card',
      )
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <AtbLogo className="app-brand__logo" />
          <div className="app-brand__copy">
            <span className="app-brand__eyebrow">ATB Operations</span>
            <h1>Card drawer manager</h1>
          </div>
        </div>

        <div className="app-search">
          <SearchBar value={searchQuery} onChange={setSearchQuery} loading={searchLoading} />
          <SearchResults
            query={searchQuery}
            results={searchResults}
            loading={searchLoading}
            error={searchError}
            onSelectResult={handleSelectSearchResult}
            onDragCard={() => {}}
          />
        </div>
      </header>

      <main className="workspace">
        <section className="workspace__board">
          {actionError ? <div className="status-panel status-panel--error">{actionError}</div> : null}

          {drawersLoading ? (
            <div className="status-panel">Loading drawers…</div>
          ) : drawersError ? (
            <div className="status-panel status-panel--error">{drawersError}</div>
          ) : selectedDrawer ? (
            <>
              <DrawerTabs
                drawers={drawers}
                selectedDrawerId={selectedDrawerId}
                onSelectDrawer={selectDrawer}
              />

              {cardsError ? (
                <div className="status-panel status-panel--error">{cardsError}</div>
              ) : null}

              <DrawerBoard
                drawer={selectedDrawer}
                cards={cards}
                selectedCellKey={selectedCellKey}
                onSelectCell={handleSelectCell}
                onMoveCard={handleMoveCard}
              />

              {cardsLoading ? <div className="loading-strip">Loading cards…</div> : null}
            </>
          ) : (
            <div className="status-panel">No drawers available.</div>
          )}
        </section>

        <SelectionInspector
          drawer={selectedDrawer}
          selectedCellKey={selectedCellKey}
          selectedCellCards={selectedCellCards}
          selectedCard={selectedCard}
          selectedCardId={selectedCardId}
          onSelectCard={handleSelectCard}
          onDragCard={() => {}}
          onDeleteCard={handleDeleteCard}
        />
      </main>
    </div>
  )
}

export default App
