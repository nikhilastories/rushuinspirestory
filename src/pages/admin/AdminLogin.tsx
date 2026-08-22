import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SITE_NAME, usePageMeta } from '../../lib/meta'
import {
  checkAdminAccess,
  consumeAuthCallback,
  fetchSession,
  githubLoginOf,
  logout,
  onAuthChange,
  startGithubLogin,
  type Session,
  type User,
} from '../../lib/identity'

type Status = 'checking' | 'idle' | 'denied' | 'error'

export default function AdminLogin() {
  const navigate = useNavigate()
  usePageMeta('Storyteller login')
  const [status, setStatus] = useState<Status>('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorHint, setErrorHint] = useState('')
  const [account, setAccount] = useState<User | null>(null)
  const [serverView, setServerView] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false

    /** Show the account as the server sees it — that is what the settings must match. */
    function showDenied(user: User) {
      setAccount(user)
      setStatus('denied')
      fetchSession().then((session) => {
        if (!cancelled) setServerView(session)
      })
    }

    consumeAuthCallback().then((outcome) => {
      if (cancelled) return

      switch (outcome.kind) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          break
        case 'not-admin':
          showDenied(outcome.user)
          break
        case 'error':
          setErrorMessage(outcome.message)
          setErrorHint(outcome.hint || '')
          setStatus('error')
          break
        default:
          setStatus('idle')
      }
    })

    const unsubscribe = onAuthChange((event, user) => {
      if (event !== 'login' || !user) return
      checkAdminAccess().then((allowed) => {
        if (cancelled) return
        if (allowed) navigate('/admin/dashboard', { replace: true })
        else showDenied(user)
      })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [navigate])

  async function signOutAndRetry() {
    await logout().catch(() => undefined)
    setAccount(null)
    setServerView(null)
    setErrorMessage('')
    setErrorHint('')
    setStatus('idle')
  }

  function beginLogin() {
    const failure = startGithubLogin()
    if (!failure) return
    setErrorMessage(failure.message)
    setErrorHint(failure.hint || '')
    setStatus('error')
  }

  const signedInAs =
    serverView?.login || serverView?.email || (account ? githubLoginOf(account) || account.email : '') || 'this account'
  const serverSawUsername = Boolean(serverView?.login)

  return (
    <div className="login-shell">
      <div className="login-card fade-in">
        <svg width="48" height="48" viewBox="0 0 64 64" style={{ margin: '0 auto' }}>
          <path d="M40 14a20 20 0 1 0 10 36 16 16 0 0 1-10-36Z" fill="#D9A441" />
          <circle cx="48" cy="18" r="2.4" fill="#F0D08B" />
        </svg>
        <h1>Storyteller Login</h1>
        <p>
          This corner of {SITE_NAME} belongs to Rushu&rsquo;s mama. Sign in with the GitHub account that owns this
          site&rsquo;s repository to draft, review, and publish new tales.
        </p>

        {status === 'checking' && <div className="spinner" style={{ margin: '0 auto' }} />}

        {(status === 'idle' || status === 'error') && (
          <button className="btn btn-primary" onClick={beginLogin}>
            Continue with GitHub
          </button>
        )}

        {status === 'denied' && (
          <>
            <div className="login-error">
              Signed in as <strong>{signedInAs}</strong>, but this site does not recognise that account as the
              storybook&rsquo;s owner.
            </div>
            <div className="login-hint">
              {serverSawUsername ? (
                <>
                  Set <code>ADMIN_GITHUB_LOGIN</code> to <code>{serverView?.login}</code> under Project configuration
                  &rarr; Environment variables, then sign in again.
                </>
              ) : (
                <>
                  Netlify Identity did not record a GitHub username for this account, so it cannot be matched by name.
                  Set <code>ADMIN_EMAIL</code> to <code>{serverView?.email || 'the email on this account'}</code>{' '}
                  under Project configuration &rarr; Environment variables, then sign in again.
                </>
              )}{' '}
              Adding <code>admin</code> to this user&rsquo;s Roles field in the Identity tab works too.
            </div>
            <button className="btn btn-primary" onClick={signOutAndRetry}>
              Sign out and try another account
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="login-error">{errorMessage}</div>
            {errorHint && <div className="login-hint">{errorHint}</div>}
          </>
        )}
      </div>
    </div>
  )
}
