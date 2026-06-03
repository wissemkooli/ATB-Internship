import { CardPreview } from './CardPreview'
import type { SearchResultCard } from '../types'

interface SearchResultsProps {
  results: SearchResultCard[]
  query: string
  loading: boolean
  error: string | null
  onSelectResult: (card: SearchResultCard) => void
  onDragCard: (card: SearchResultCard | null) => void
}

export function SearchResults({
  results,
  query,
  loading,
  error,
  onSelectResult,
  onDragCard,
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
        <div className="search-results__empty">No cards matched this query.</div>
      ) : null}

      <div className="search-results__list">
        {results.map((card) => (
          <div key={card.id} className="search-results__item">
            <CardPreview
              card={card}
              onClick={() => onSelectResult(card)}
              onDragStart={() => onDragCard(card)}
              onDragEnd={() => onDragCard(null)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
