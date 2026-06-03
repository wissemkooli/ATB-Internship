import { useEffect, useState } from 'react'
import { api, enrichSearchResults } from '../lib/api'
import type { Drawer, SearchResultCard } from '../types'

function useDebouncedValue<T>(value: T, delay = 220) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => window.clearTimeout(timer)
  }, [delay, value])

  return debouncedValue
}

export function useCardSearch(query: string, drawers: Drawer[]) {
  const [results, setResults] = useState<SearchResultCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebouncedValue(query.trim())

  useEffect(() => {
    let isActive = true

    if (debouncedQuery.length < 2) {
      setResults([])
      setLoading(false)
      setError(null)
      return () => {
        isActive = false
      }
    }

    setLoading(true)
    setError(null)

    void api
      .searchCards(debouncedQuery)
      .then((cards) => {
        if (!isActive) {
          return
        }

        const enrichedResults = enrichSearchResults(cards, drawers).sort((left, right) => {
          const drawerComparison = left.drawer_name.localeCompare(right.drawer_name)
          if (drawerComparison !== 0) {
            return drawerComparison
          }

          if (left.row !== right.row) {
            return left.row - right.row
          }

          if (left.col !== right.col) {
            return left.col - right.col
          }

          return left.order - right.order
        })

        setResults(enrichedResults.slice(0, 12))
      })
      .catch((requestError) => {
        if (!isActive) {
          return
        }

        setError(
          requestError instanceof Error ? requestError.message : 'Unable to search cards',
        )
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [debouncedQuery, drawers])

  return {
    results,
    loading,
    error,
    debouncedQuery,
  }
}
