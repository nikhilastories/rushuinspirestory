import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getAdminUser } from '../lib/identity'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    let cancelled = false
    getAdminUser().then((user) => {
      if (!cancelled) setState(user ? 'allowed' : 'denied')
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'checking') {
    return (
      <div className="center-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (state === 'denied') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
