import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Drawer } from '../types'

export function useDrawers() {
  const [drawers, setDrawers] = useState<Drawer[]>([])
  const [selectedDrawerId, setSelectedDrawerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDrawers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextDrawers = await api.getDrawers()
      setDrawers(nextDrawers)
      setSelectedDrawerId((currentSelection) => currentSelection ?? nextDrawers[0]?.id ?? null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load drawers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDrawers()
  }, [loadDrawers])

  const selectedDrawer = useMemo(
    () => drawers.find((drawer) => drawer.id === selectedDrawerId) ?? null,
    [drawers, selectedDrawerId],
  )

  const selectDrawer = useCallback((drawerId: number) => {
    setSelectedDrawerId(drawerId)
  }, [])

  const createDrawer = useCallback(async (payload: import('../types').DrawerCreate) => {
    try {
      const newDrawer = await api.createDrawer(payload)
      setDrawers((current) => [...current, newDrawer])
      setSelectedDrawerId(newDrawer.id)
      return newDrawer
    } catch (err) {
      throw err
    }
  }, [])

  return {
    drawers,
    selectedDrawer,
    selectedDrawerId,
    loading,
    error,
    selectDrawer,
    createDrawer,
    refreshDrawers: loadDrawers,
    setSelectedDrawerId,
  }
}

