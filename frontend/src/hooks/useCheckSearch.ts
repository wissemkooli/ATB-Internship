import { useEffect, useState } from 'react'
import { api, enrichCheckSearchResults } from '../lib/api'
import type { Drawer, SearchResultCheck } from '../types'

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

export function useCheckSearch(drawers: Drawer[]) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultCheck[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebouncedValue(query.trim())

  useEffect(() => {
    let isActive = true

    if (debouncedQuery.length < 2) {
      setResults([])
      setIsSearching(false)
      setError(null)
      return () => {
        isActive = false
      }
    }

    setIsSearching(true)
    setError(null)

    void api
      .searchChecks(debouncedQuery)
      .then((checks) => {
        if (!isActive) {
          return
        }

        const enrichedResults = enrichCheckSearchResults(checks, drawers).sort((left, right) => {
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

        setError(requestError instanceof Error ? requestError.message : 'Unable to search checks')
      })
      .finally(() => {
        if (isActive) {
          setIsSearching(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [debouncedQuery, drawers])

  return {
    results,
    query,
    setQuery,
    isSearching,
    loading: isSearching,
    error,
    debouncedQuery,
  }
}
