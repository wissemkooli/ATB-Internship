import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { Check, CheckCreate, CheckMovePayload } from '../types'

function sortChecks(checks: Check[]) {
  return [...checks].sort((left, right) => {
    if (left.row !== right.row) {
      return left.row - right.row
    }

    if (left.col !== right.col) {
      return left.col - right.col
    }

    return left.order - right.order
  })
}

export function useDrawerChecks(drawerId: number | null) {
  const [checks, setChecks] = useState<Check[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checksRef = useRef<Check[]>([])

  useEffect(() => {
    checksRef.current = checks
  }, [checks])

  const loadChecks = useCallback(async () => {
    if (drawerId === null) {
      setChecks([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextChecks = await api.getDrawerChecks(drawerId)
      setChecks(sortChecks(nextChecks))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load checks')
    } finally {
      setLoading(false)
    }
  }, [drawerId])

  useEffect(() => {
    void loadChecks()
  }, [loadChecks])

  const getCheckById = useCallback(
    (checkId: number) => checksRef.current.find((check) => check.id === checkId) ?? null,
    [],
  )

  const moveCheck = useCallback(async (checkId: number, payload: CheckMovePayload) => {
    const currentChecks = checksRef.current
    const targetIndex = currentChecks.findIndex((check) => check.id === checkId)
    if (targetIndex === -1) {
      return null
    }

    const previousChecks = currentChecks
    const sourceCheck = currentChecks[targetIndex]
    const optimisticCheck: Check = {
      ...sourceCheck,
      ...payload,
    }

    setChecks(sortChecks(currentChecks.map((check) => (check.id === checkId ? optimisticCheck : check))))

    try {
      const updatedCheck = await api.moveCheck(checkId, payload)
      setChecks((current) =>
        sortChecks(current.map((check) => (check.id === checkId ? updatedCheck : check))),
      )
      return updatedCheck
    } catch (requestError) {
      setChecks(previousChecks)
      throw requestError
    }
  }, [])

  const deleteCheck = useCallback(async (checkId: number) => {
    const previousChecks = checksRef.current
    setChecks(previousChecks.filter((check) => check.id !== checkId))

    try {
      await api.deleteCheck(checkId)
      return true
    } catch (requestError) {
      setChecks(previousChecks)
      throw requestError
    }
  }, [])

  const addCheck = useCallback(async (payload: CheckCreate) => {
    const newCheck = await api.addCheck(payload)
    setChecks((current) => sortChecks([...current, newCheck]))
    return newCheck
  }, [])

  const checksByCell = useMemo(() => {
    const grouped = new Map<string, Check[]>()

    for (const check of checks) {
      const key = `${check.row}:${check.col}`
      const bucket = grouped.get(key)

      if (bucket) {
        bucket.push(check)
      } else {
        grouped.set(key, [check])
      }
    }

    for (const bucket of grouped.values()) {
      bucket.sort((left, right) => left.order - right.order)
    }

    return grouped
  }, [checks])

  return {
    checks,
    checksByCell,
    loading,
    isLoading: loading,
    error,
    getCheckById,
    loadChecks,
    moveCheck,
    deleteCheck,
    addCheck,
    setChecks,
  }
}
