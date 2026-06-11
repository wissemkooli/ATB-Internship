import type { Drawer } from '../types'

interface DrawerTabsProps {
  drawers: Drawer[]
  selectedDrawerId: number | null
  onSelectDrawer: (drawerId: number) => void
  onAddDrawerClick: () => void
}

export function DrawerTabs({ drawers, selectedDrawerId, onSelectDrawer, onAddDrawerClick }: DrawerTabsProps) {
  return (
    <div className="drawer-tabs" role="tablist" aria-label="Drawers">
      {drawers.map((drawer) => {
        const isActive = drawer.id === selectedDrawerId

        return (
          <button
            key={drawer.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={['drawer-tabs__item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
            onClick={() => onSelectDrawer(drawer.id)}
          >
            <span className="drawer-tabs__name">{drawer.name}</span>
            <span className="drawer-tabs__size">
              {drawer.rows} × {drawer.cols}
            </span>
          </button>
        )
      })}
      
      <button
        type="button"
        className="drawer-tabs__item"
        onClick={onAddDrawerClick}
        style={{ borderStyle: 'dashed', background: 'transparent' }}
      >
        <span className="drawer-tabs__name" style={{ color: 'var(--muted)' }}>+ Add Drawer</span>
      </button>
    </div>
  )
}

