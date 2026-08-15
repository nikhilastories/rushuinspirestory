import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUser, handleAuthCallback, oauthLogin, onAuthChange } from '../../lib/identity'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'idle' | 'denied' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const result = await handleAuthCallback()
        if (result?.type === 'oauth' && cancelled === false) {
          const admin = await getAdminUser()
          if (admin) {
            navigate('/admin/dashboard', { replace: true })
            return
          }
          setStatus('denied')
          return
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Sign-in failed.')
          setStatus('error')
          return
        }
      }

      const admin = await getAdminUser()
      if (cancelled) return
      if (admin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        setStatus('idle')
      }
    }

    bootstrap()

    const unsubscribe = onAuthChange(async (event) => {
      if (event === 'login') {
        const admin = await getAdminUser()
        if (admin) navigate('/admin/dashboard', { replace: true })
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [navigate])

  return (
    <div className="login-shell">
      <div className="login-card fade-in">
        <svg width="48" height="48" viewBox="0 0 64 64" style={{ margin: '0 auto' }}>
          <path d="M40 14a20 20 0 1 0 10 36 16 16 0 0 1-10-36Z" fill="#D9A441" />
          <circle cx="48" cy="18" r="2.4" fill="#F0D08B" />
        </svg>
        <h1>Storyteller Login</h1>
        <p>
          This corner of the storybook belongs to Rushu&rsquo;s mama. Sign in with the GitHub account that owns this
          storybook&rsquo;s repository to draft, review, and publish new tales.
        </p>

        {status === 'checking' && <div className="spinner" style={{ margin: '0 auto' }} />}

        {(status === 'idle' || status === 'denied' || status === 'error') && (
          <button className="btn btn-primary" onClick={() => oauthLogin('github')}>
            Continue with GitHub
          </button>
        )}

        {status === 'denied' && (
          <div className="login-error">
            This GitHub account isn&rsquo;t the storybook owner, so admin access isn&rsquo;t available. Sign in with
            the repository owner&rsquo;s GitHub account instead.
          </div>
        )}

        {status === 'error' && <div className="login-error">{errorMessage}</div>}
      </div>
    </div>
  )
}
