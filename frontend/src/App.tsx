import { useMemo, useState } from 'react'
import { DrawerBoard } from './components/DrawerBoard'
import { AtbLogo } from './components/AtbLogo'
import { DrawerTabs } from './components/DrawerTabs'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { SelectionInspector } from './components/SelectionInspector'
import { Login } from './components/Login'
import { AdminDashboard } from './components/AdminDashboard'
import { AddDrawerModal } from './components/AddDrawerModal'
import { AddCardModal } from './components/AddCardModal'
import { AddCheckModal } from './components/AddCheckModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuditProvider, useAudit } from './context/AuditContext'
import { useCardSearch } from './hooks/useCardSearch'
import { useCheckSearch } from './hooks/useCheckSearch'
import { useDrawerCards } from './hooks/useDrawerCards'
import { useDrawerChecks } from './hooks/useDrawerChecks'
import { useDrawers } from './hooks/useDrawers'
import {
  cellKey,
  isCheck,
  type CardType,
  type CarnetSize,
  type DrawerItem,
  type DrawerType,
  type SearchResultItem,
} from './types'
import { api } from './lib/api'
import './App.css'

type AdminView = 'workspace' | 'dashboard'

function AppInner() {
  const { user, logout } = useAuth()
  const { addLog } = useAudit()
  const [adminView, setAdminView] = useState<AdminView>('workspace')

  const {
    drawers,
    selectedDrawer,
    selectedDrawerId,
    loading: drawersLoading,
    error: drawersError,
    selectDrawer,
    createDrawer,
  } = useDrawers()

  const activeDrawerType: DrawerType = selectedDrawer?.drawer_type ?? 'cards'
  const cardDrawerId = activeDrawerType === 'cards' ? selectedDrawerId : null
  const checkDrawerId = activeDrawerType === 'checks' ? selectedDrawerId : null

  const {
    cards,
    cardsByCell,
    loading: cardsLoading,
    error: cardsError,
    getCardById,
    moveCard,
    deleteCard,
    addCard,
  } = useDrawerCards(cardDrawerId)

  const {
    checks,
    checksByCell,
    loading: checksLoading,
    error: checksError,
    getCheckById,
    moveCheck,
    deleteCheck,
    addCheck,
  } = useDrawerChecks(checkDrawerId)

  const [cardSearchQuery, setCardSearchQuery] = useState('')
  const checkSearch = useCheckSearch(drawers)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isAddDrawerModalOpen, setIsAddDrawerModalOpen] = useState(false)
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false)
  const [isAddCheckModalOpen, setIsAddCheckModalOpen] = useState(false)

  const { results: cardSearchResults, loading: cardSearchLoading, error: cardSearchError } = useCardSearch(
    activeDrawerType === 'cards' ? cardSearchQuery : '',
    drawers,
  )

  const activeItems: DrawerItem[] = activeDrawerType === 'checks' ? checks : cards
  const activeItemsByCell = activeDrawerType === 'checks' ? checksByCell : cardsByCell
  const activeLoading = activeDrawerType === 'checks' ? checksLoading : cardsLoading
  const activeError = activeDrawerType === 'checks' ? checksError : cardsError
  const activeQuery = activeDrawerType === 'checks' ? checkSearch.query : cardSearchQuery
  const activeSearchResults: SearchResultItem[] = activeDrawerType === 'checks' ? checkSearch.results : cardSearchResults
  const activeSearchLoading = activeDrawerType === 'checks' ? checkSearch.isSearching : cardSearchLoading
  const activeSearchError = activeDrawerType === 'checks' ? checkSearch.error : cardSearchError
  const setActiveQuery = activeDrawerType === 'checks' ? checkSearch.setQuery : setCardSearchQuery

  const selectedCellItems = useMemo(() => {
    if (!selectedCellKey) return []
    return activeItemsByCell.get(selectedCellKey) ?? []
  }, [activeItemsByCell, selectedCellKey])

  const selectedItem = useMemo(() => {
    if (selectedItemId === null) return null
    return activeItems.find((item) => item.id === selectedItemId) ?? null
  }, [activeItems, selectedItemId])

  const handleSelectCell = (row: number, col: number) => {
    const nextCellKey = cellKey(row, col)

    api.highlightCompartment(row, col).catch((err) => {
      console.error('Failed to highlight compartment:', err)
    })

    if (selectedCellKey === nextCellKey) {
      setSelectedCellKey(null)
      setSelectedItemId(null)
      return
    }

    const nextItems = activeItemsByCell.get(nextCellKey) ?? []
    const nextSelectedItem = nextItems[nextItems.length - 1] ?? null

    setSelectedCellKey(nextCellKey)
    setSelectedItemId(nextSelectedItem?.id ?? null)
  }

  const handleSelectItem = (item: DrawerItem) => {
    setSelectedCellKey(cellKey(item.row, item.col))
    setSelectedItemId(item.id)
  }

  const handleSelectSearchResult = (item: SearchResultItem) => {
    if (isCheck(item)) {
      api.highlightCompartment(item.row, item.col).catch((err) => {
        console.error('Failed to highlight check compartment:', err)
      })
    } else {
      api.highlightCard(item.id).catch((err) => {
        console.error('Failed to highlight card:', err)
      })
    }

    selectDrawer(item.drawer_id)
    setSelectedCellKey(cellKey(item.row, item.col))
    setSelectedItemId(item.id)
    setActiveQuery('')
  }

  const handleMoveItem = async (itemId: number, row: number, col: number, order: number) => {
    if (selectedDrawerId === null) return

    setActionError(null)

    try {
      const payload = {
        row,
        col,
        order,
        drawer_id: selectedDrawerId,
      }
      const updatedItem = activeDrawerType === 'checks'
        ? await moveCheck(itemId, payload)
        : await moveCard(itemId, payload)

      if (updatedItem) {
        setSelectedCellKey(cellKey(updatedItem.row, updatedItem.col))
        setSelectedItemId(updatedItem.id)

        addLog({
          operator: user?.displayName ?? 'Unknown',
          actionType: 'move',
          description: `Moved ${activeDrawerType === 'checks' ? 'Check' : 'Card'} #${itemId} to Row ${row}, Col ${col}`,
        })
      }
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : `Unable to move ${activeDrawerType === 'checks' ? 'check' : 'card'}`)
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    const item = activeDrawerType === 'checks' ? getCheckById(itemId) ?? selectedItem : getCardById(itemId) ?? selectedItem
    const itemCellKey = item ? cellKey(item.row, item.col) : null
    const wasSelected = selectedItemId === itemId

    setActionError(null)

    try {
      if (activeDrawerType === 'checks') {
        await deleteCheck(itemId)
      } else {
        await deleteCard(itemId)
      }

      addLog({
        operator: user?.displayName ?? 'Unknown',
        actionType: 'delete',
        description: `Deleted ${activeDrawerType === 'checks' ? 'Check' : 'Card'} #${itemId}${item ? ` from Row ${item.row}, Col ${item.col}` : ''}`,
      })

      if (wasSelected && itemCellKey) {
        const remainingItems = activeItems
          .filter((candidate) => candidate.id !== itemId)
          .filter((candidate) => cellKey(candidate.row, candidate.col) === itemCellKey)
        const nextItem = remainingItems[remainingItems.length - 1] ?? null

        setSelectedCellKey(itemCellKey)
        setSelectedItemId(nextItem?.id ?? null)
      }
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : `Unable to delete ${activeDrawerType === 'checks' ? 'check' : 'card'}`)
    }
  }

  const handleAddDrawerSubmit = async (name: string, rows: number, cols: number, drawerType: DrawerType) => {
    const newDrawer = await createDrawer({ name, rows, cols, drawer_type: drawerType })
    setSelectedCellKey(null)
    setSelectedItemId(null)
    addLog({
      operator: user?.displayName ?? 'Unknown',
      actionType: 'create',
      description: `Created ${drawerType === 'checks' ? 'Check' : 'Card'} Drawer #${newDrawer.id} "${newDrawer.name}"`,
    })
  }

  const handleAddCardSubmit = async (cardholderName: string, cardNumber: string, expirationDate: string, cardType: CardType) => {
    if (selectedDrawerId === null || !selectedCellKey) return
    const [rowStr, colStr] = selectedCellKey.split(':')
    const row = parseInt(rowStr, 10)
    const col = parseInt(colStr, 10)
    const order = selectedCellItems.length + 1

    const newCard = await addCard({
      cardholder_name: cardholderName,
      card_number: cardNumber,
      expiration_date: expirationDate,
      card_type: cardType,
      drawer_id: selectedDrawerId,
      row,
      col,
      order,
    })
    addLog({
      operator: user?.displayName ?? 'Unknown',
      actionType: 'create',
      description: `Added Card #${newCard.id} to Drawer #${selectedDrawerId} (Row ${row}, Col ${col})`,
    })
    setSelectedItemId(newCard.id)
  }

  const handleAddCheckSubmit = async (clientName: string, checkNumber: string, montant: number, carnetSize: CarnetSize) => {
    if (selectedDrawerId === null || !selectedCellKey) return
    const [rowStr, colStr] = selectedCellKey.split(':')
    const row = parseInt(rowStr, 10)
    const col = parseInt(colStr, 10)
    const order = selectedCellItems.length + 1

    const newCheck = await addCheck({
      client_name: clientName,
      check_number: checkNumber,
      montant,
      carnet_size: carnetSize,
      drawer_id: selectedDrawerId,
      row,
      col,
      order,
    })
    addLog({
      operator: user?.displayName ?? 'Unknown',
      actionType: 'create',
      description: `Added Check #${newCheck.id} to Drawer #${selectedDrawerId} (Row ${row}, Col ${col})`,
    })
    setSelectedItemId(newCheck.id)
  }

  if (!user) {
    return <Login />
  }

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
        <SearchBar value={activeQuery} onChange={setActiveQuery} loading={activeSearchLoading} />
        <SearchResults
          query={activeQuery}
          results={activeSearchResults}
          loading={activeSearchLoading}
          error={activeSearchError}
          onSelectResult={handleSelectSearchResult}
          onDragItem={() => {}}
        />
      </div>
    </header>
  )

  const modals = (
    <>
      <AddDrawerModal
        isOpen={isAddDrawerModalOpen}
        onClose={() => setIsAddDrawerModalOpen(false)}
        onSubmit={handleAddDrawerSubmit}
      />
      {selectedDrawer && selectedCellKey && activeDrawerType === 'cards' ? (
        <AddCardModal
          isOpen={isAddCardModalOpen}
          onClose={() => setIsAddCardModalOpen(false)}
          onSubmit={handleAddCardSubmit}
          drawerName={selectedDrawer.name}
          row={parseInt(selectedCellKey.split(':')[0], 10)}
          col={parseInt(selectedCellKey.split(':')[1], 10)}
        />
      ) : null}
      {selectedDrawer && selectedCellKey && activeDrawerType === 'checks' ? (
        <AddCheckModal
          isOpen={isAddCheckModalOpen}
          onClose={() => setIsAddCheckModalOpen(false)}
          onSubmit={handleAddCheckSubmit}
          drawerName={selectedDrawer.name}
          row={parseInt(selectedCellKey.split(':')[0], 10)}
          col={parseInt(selectedCellKey.split(':')[1], 10)}
        />
      ) : null}
    </>
  )

  const workspace = (
    <WorkspaceView
      drawers={drawers}
      selectedDrawer={selectedDrawer}
      selectedDrawerId={selectedDrawerId}
      drawersLoading={drawersLoading}
      drawersError={drawersError}
      itemsLoading={activeLoading}
      itemsError={activeError}
      items={activeItems}
      selectedCellKey={selectedCellKey}
      selectedCellItems={selectedCellItems}
      selectedItem={selectedItem}
      selectedItemId={selectedItemId}
      actionError={actionError}
      onSelectDrawer={(drawerId) => {
        selectDrawer(drawerId)
        setSelectedCellKey(null)
        setSelectedItemId(null)
      }}
      onSelectCell={handleSelectCell}
      onSelectItem={handleSelectItem}
      onMoveItem={handleMoveItem}
      onDeleteItem={handleDeleteItem}
      onAddDrawerClick={() => setIsAddDrawerModalOpen(true)}
      onAddItemClick={() => {
        if (activeDrawerType === 'checks') {
          setIsAddCheckModalOpen(true)
        } else {
          setIsAddCardModalOpen(true)
        }
      }}
    />
  )

  if (user.role === 'admin') {
    return (
      <div className="app-shell">
        {header}
        {modals}

        <nav className="nav-bar" aria-label="Admin navigation">
          <div className="drawer-tabs">
            <button
              type="button"
              id="nav-tab-workspace"
              className={['drawer-tabs__item', adminView === 'workspace' ? 'is-active' : ''].join(' ')}
              onClick={() => setAdminView('workspace')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            <button type="button" id="logout-btn" className="action-button" onClick={logout}>
              Sign out
            </button>
          </div>
        </nav>

        {adminView === 'workspace' ? workspace : <AdminDashboard />}
      </div>
    )
  }

  return (
    <div className="app-shell">
      {header}
      {modals}

      <div className="nav-bar">
        <div className="nav-bar__right">
          <span className="nav-bar__user">
            <span className="badge badge--active">{user.role}</span>
            {user.displayName}
          </span>
          <button type="button" id="logout-btn" className="action-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {workspace}
    </div>
  )
}

interface WorkspaceViewProps {
  drawers: ReturnType<typeof useDrawers>['drawers']
  selectedDrawer: ReturnType<typeof useDrawers>['selectedDrawer']
  selectedDrawerId: ReturnType<typeof useDrawers>['selectedDrawerId']
  drawersLoading: boolean
  drawersError: string | null
  itemsLoading: boolean
  itemsError: string | null
  items: DrawerItem[]
  selectedCellKey: string | null
  selectedCellItems: DrawerItem[]
  selectedItem: DrawerItem | null
  selectedItemId: number | null
  actionError: string | null
  onSelectDrawer: (id: number) => void
  onSelectCell: (row: number, col: number) => void
  onSelectItem: (item: DrawerItem) => void
  onMoveItem: (itemId: number, row: number, col: number, order: number) => void
  onDeleteItem: (itemId: number) => void
  onAddDrawerClick: () => void
  onAddItemClick: () => void
}

function WorkspaceView({
  drawers,
  selectedDrawer,
  selectedDrawerId,
  drawersLoading,
  drawersError,
  itemsLoading,
  itemsError,
  items,
  selectedCellKey,
  selectedCellItems,
  selectedItem,
  selectedItemId,
  actionError,
  onSelectDrawer,
  onSelectCell,
  onSelectItem,
  onMoveItem,
  onDeleteItem,
  onAddDrawerClick,
  onAddItemClick,
}: WorkspaceViewProps) {
  const itemLabel = selectedDrawer?.drawer_type === 'checks' ? 'checks' : 'cards'

  return (
    <main className="workspace">
      <section className="workspace__board">
        {actionError ? <div className="status-panel status-panel--error">{actionError}</div> : null}

        {drawersLoading ? (
          <div className="status-panel">Loading drawers...</div>
        ) : drawersError ? (
          <div className="status-panel status-panel--error">{drawersError}</div>
        ) : selectedDrawer ? (
          <>
            <DrawerTabs
              drawers={drawers}
              selectedDrawerId={selectedDrawerId}
              onSelectDrawer={onSelectDrawer}
              onAddDrawerClick={onAddDrawerClick}
            />

            {itemsError ? (
              <div className="status-panel status-panel--error">{itemsError}</div>
            ) : null}

            <DrawerBoard
              drawer={selectedDrawer}
              items={items}
              selectedCellKey={selectedCellKey}
              onSelectCell={onSelectCell}
              onMoveItem={onMoveItem}
            />

            {itemsLoading ? <div className="loading-strip">Loading {itemLabel}...</div> : null}
          </>
        ) : (
          <div className="status-panel">No drawers available.</div>
        )}
      </section>

      <SelectionInspector
        drawer={selectedDrawer}
        selectedCellKey={selectedCellKey}
        selectedCellItems={selectedCellItems}
        selectedItem={selectedItem}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        onDragItem={() => {}}
        onDeleteItem={onDeleteItem}
        onAddItemClick={onAddItemClick}
      />
    </main>
  )
}

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
