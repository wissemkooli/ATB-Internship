interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  loading: boolean
}

export function SearchBar({ value, onChange, loading }: SearchBarProps) {
  return (
    <label className="search-bar">
      <span className="search-bar__label">Search cards</span>
      <div className="search-bar__field">
        <svg className="search-bar__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M10.5 4a6.5 6.5 0 1 0 4.096 11.546l4.429 4.43 1.415-1.415-4.43-4.428A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
            fill="currentColor"
          />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Cardholder or card number"
          autoComplete="off"
        />
        {loading ? <span className="search-bar__spinner" aria-hidden="true" /> : null}
      </div>
    </label>
  )
}

