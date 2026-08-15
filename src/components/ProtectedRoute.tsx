import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { checkAdminAccess } from '../lib/identity'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    let cancelled = false
    checkAdminAccess().then((allowed) => {
      if (!cancelled) setState(allowed ? 'allowed' : 'denied')
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
