import { useMemo, useState } from 'react'
import { DrawerBoard } from './components/DrawerBoard'
import { AtbLogo } from './components/AtbLogo'
import { DrawerTabs } from './components/DrawerTabs'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { SelectionInspector } from './components/SelectionInspector'
import { Login } from './components/Login'
import { AdminDashboard } from './components/AdminDashboard'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuditProvider, useAudit } from './context/AuditContext'
import { useCardSearch } from './hooks/useCardSearch'
import { useDrawerCards } from './hooks/useDrawerCards'
import { useDrawers } from './hooks/useDrawers'
import { cellKey, type Card, type SearchResultCard } from './types'
import { api } from './lib/api'
import './App.css'

// ─── View types ──────────────────────────────────────────────────────────────

type AdminView = 'workspace' | 'dashboard'

// ─── Inner app (needs auth context) ─────────────────────────────────────────

function AppInner() {
  const { user, logout } = useAuth()
  const { addLog } = useAudit()

  // Admin navigation state
  const [adminView, setAdminView] = useState<AdminView>('workspace')

  // ── Drawer / card state (existing) ────────────────────────────────────────
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
    if (!selectedCellKey) return []
    return cardsByCell.get(selectedCellKey) ?? []
  }, [cardsByCell, selectedCellKey])

  const selectedCard = useMemo(() => {
    if (selectedCardId === null) return null
    return cards.find((card) => card.id === selectedCardId) ?? null
  }, [cards, selectedCardId])

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    if (selectedDrawerId === null) return

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

        // Audit log
        addLog({
          operator: user?.displayName ?? 'Unknown',
          actionType: 'move',
          description: `Moved Card #${cardId} to Row ${row}, Col ${col}`,
        })
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

      // Audit log
      addLog({
        operator: user?.displayName ?? 'Unknown',
        actionType: 'delete',
        description: `Deleted Card #${cardId}${card ? ` from Row ${card.row}, Col ${card.col}` : ''}`,
      })

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

  // ── If not logged in ──────────────────────────────────────────────────────

  if (!user) {
    return <Login />
  }

  // ── Shared header ─────────────────────────────────────────────────────────

  const header = (
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
  )

  // ── Admin view ────────────────────────────────────────────────────────────

  if (user.role === 'admin') {
    return (
      <div className="app-shell">
        {header}

        {/* Admin navigation bar */}
        <nav className="nav-bar" aria-label="Admin navigation">
          <div className="drawer-tabs">
            <button
              type="button"
              id="nav-tab-workspace"
              className={['drawer-tabs__item', adminView === 'workspace' ? 'is-active' : ''].join(' ')}
              onClick={() => setAdminView('workspace')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span className="drawer-tabs__name">Drawer Workspace</span>
            </button>

            <button
              type="button"
              id="nav-tab-dashboard"
              className={['drawer-tabs__item', adminView === 'dashboard' ? 'is-active' : ''].join(' ')}
              onClick={() => setAdminView('dashboard')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3h7v4H3z" />
                <path d="M14 3h7v9h-7z" />
                <path d="M3 11h7v10H3z" />
                <path d="M14 16h7v6h-7z" />
              </svg>
              <span className="drawer-tabs__name">Admin Dashboard</span>
            </button>
          </div>

          <div className="nav-bar__right">
            <span className="nav-bar__user">
              <span className="badge badge--active">{user.role}</span>
              {user.displayName}
            </span>
            <button
              type="button"
              id="logout-btn"
              className="action-button"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </nav>

        {adminView === 'workspace' ? (
          <WorkspaceView
            drawers={drawers}
            selectedDrawer={selectedDrawer}
            selectedDrawerId={selectedDrawerId}
            drawersLoading={drawersLoading}
            drawersError={drawersError}
            cardsLoading={cardsLoading}
            cardsError={cardsError}
            cards={cards}
            selectedCellKey={selectedCellKey}
            selectedCellCards={selectedCellCards}
            selectedCard={selectedCard}
            selectedCardId={selectedCardId}
            actionError={actionError}
            onSelectDrawer={selectDrawer}
            onSelectCell={handleSelectCell}
            onSelectCard={handleSelectCard}
            onMoveCard={handleMoveCard}
            onDeleteCard={handleDeleteCard}
          />
        ) : (
          <AdminDashboard />
        )}
      </div>
    )
  }

  // ── Operator view ─────────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      {header}

      <div className="nav-bar">
        <div className="nav-bar__right">
          <span className="nav-bar__user">
            <span className="badge badge--active">{user.role}</span>
            {user.displayName}
          </span>
          <button
            type="button"
            id="logout-btn"
            className="action-button"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>

      <WorkspaceView
        drawers={drawers}
        selectedDrawer={selectedDrawer}
        selectedDrawerId={selectedDrawerId}
        drawersLoading={drawersLoading}
        drawersError={drawersError}
        cardsLoading={cardsLoading}
        cardsError={cardsError}
        cards={cards}
        selectedCellKey={selectedCellKey}
        selectedCellCards={selectedCellCards}
        selectedCard={selectedCard}
        selectedCardId={selectedCardId}
        actionError={actionError}
        onSelectDrawer={selectDrawer}
        onSelectCell={handleSelectCell}
        onSelectCard={handleSelectCard}
        onMoveCard={handleMoveCard}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  )
}

// ─── Workspace view (extracted for reuse) ────────────────────────────────────

interface WorkspaceViewProps {
  drawers: ReturnType<typeof useDrawers>['drawers']
  selectedDrawer: ReturnType<typeof useDrawers>['selectedDrawer']
  selectedDrawerId: ReturnType<typeof useDrawers>['selectedDrawerId']
  drawersLoading: boolean
  drawersError: string | null
  cardsLoading: boolean
  cardsError: string | null
  cards: Card[]
  selectedCellKey: string | null
  selectedCellCards: Card[]
  selectedCard: Card | null
  selectedCardId: number | null
  actionError: string | null
  onSelectDrawer: (id: number) => void
  onSelectCell: (row: number, col: number) => void
  onSelectCard: (card: Card) => void
  onMoveCard: (cardId: number, row: number, col: number, order: number) => void
  onDeleteCard: (cardId: number) => void
}

function WorkspaceView({
  drawers,
  selectedDrawer,
  selectedDrawerId,
  drawersLoading,
  drawersError,
  cardsLoading,
  cardsError,
  cards,
  selectedCellKey,
  selectedCellCards,
  selectedCard,
  selectedCardId,
  actionError,
  onSelectDrawer,
  onSelectCell,
  onSelectCard,
  onMoveCard,
  onDeleteCard,
}: WorkspaceViewProps) {
  return (
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
              onSelectDrawer={onSelectDrawer}
            />

            {cardsError ? (
              <div className="status-panel status-panel--error">{cardsError}</div>
            ) : null}

            <DrawerBoard
              drawer={selectedDrawer}
              cards={cards}
              selectedCellKey={selectedCellKey}
              onSelectCell={onSelectCell}
              onMoveCard={onMoveCard}
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
        onSelectCard={onSelectCard}
        onDragCard={() => {}}
        onDeleteCard={onDeleteCard}
      />
    </main>
  )
}

// ─── Root with providers ──────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <AuditProvider>
        <AppInner />
      </AuditProvider>
    </AuthProvider>
  )
}

export default App
