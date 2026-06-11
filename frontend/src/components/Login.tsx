import { type FormEvent, useState } from 'react'
import { AtbLogo } from './AtbLogo'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setError(null)
    setLoading(true)

    const ok = await login(username, password)

    setLoading(false)
    if (!ok) {
      setError('Invalid username or password. Please try again.')
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        {/* ── Brand side ── */}
        <div className="login-panel__brand">
          <AtbLogo className="login-panel__logo" />
          <div className="login-panel__copy">
            <span className="app-brand__eyebrow">ATB Operations</span>
            <h1 className="login-panel__title">Card drawer manager</h1>
            <p className="login-panel__sub">
              Secure access to the physical card drawer system.
              <br />
              Sign in with your operator credentials.
            </p>
          </div>
        </div>

        {/* ── Form side ── */}
        <div className="login-panel__form">
          <div className="login-panel__form-inner">
            <div className="login-panel__form-header">
              <span className="search-bar__label">Operator Sign-In</span>
              <h2 className="login-panel__form-title">Welcome back</h2>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="login-form__error" role="alert">
                  {error}
                </div>
              )}

              <div className="login-form__field-group">
                <label className="search-bar__label" htmlFor="login-username">
                  Username
                </label>
                <div className="search-bar__field">
                  {/* User icon */}
                  <svg
                    className="search-bar__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. ahmed"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="login-form__field-group">
                <label className="search-bar__label" htmlFor="login-password">
                  Password
                </label>
                <div className="search-bar__field">
                  {/* Lock icon */}
                  <svg
                    className="search-bar__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="0" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="action-button login-form__submit"
                disabled={loading || !username.trim() || !password}
              >
                {loading ? (
                  <>
                    <span className="login-form__spinner" aria-hidden="true" />
                    Authenticating…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="login-panel__hint">
              <span className="search-bar__label" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Demo credentials
              </span>
              <div className="login-panel__creds">
                <span>admin / admin123</span>
                <span>ahmed / op1234</span>
                <span>sana / op5678</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
