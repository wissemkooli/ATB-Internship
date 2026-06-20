import { CardPreview } from './CardPreview'
import { CheckPreview } from './CheckPreview'
import type { SearchResultItem } from '../types'
import { isCheck } from '../types'

interface SearchResultsProps {
  results: SearchResultItem[]
  query: string
  loading: boolean
  error: string | null
  onSelectResult: (item: SearchResultItem) => void
  onDragItem: (item: SearchResultItem | null) => void
}

export function SearchResults({
  results,
  query,
  loading,
  error,
  onSelectResult,
  onDragItem,
}: SearchResultsProps) {
  if (query.trim().length < 2 && !loading && !error) {
    return null
  }

  return (
    <section className="search-results" aria-label="Search results">
      <div className="search-results__header">
        <strong>Matches</strong>
        <span>{loading ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}`}</span>
      </div>

      {error ? <div className="search-results__error">{error}</div> : null}

      {!error && results.length === 0 && !loading ? (
        <div className="search-results__empty">No items matched this query.</div>
      ) : null}

      <div className="search-results__list">
        {results.map((item) => (
          <div key={`${isCheck(item) ? 'check' : 'card'}-${item.id}`} className="search-results__item">
            {isCheck(item) ? (
              <CheckPreview
                check={item}
                onClick={() => onSelectResult(item)}
                onDragStart={() => onDragItem(item)}
                onDragEnd={() => onDragItem(null)}
              />
            ) : (
              <CardPreview
                card={item}
                onClick={() => onSelectResult(item)}
                onDragStart={() => onDragItem(item)}
                onDragEnd={() => onDragItem(null)}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
