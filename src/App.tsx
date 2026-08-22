import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import { consumeAuthCallback, hasAuthCallback } from './lib/identity'
import Home from './pages/Home'
import Stories from './pages/Stories'
import Collections from './pages/Collections'
import StoryDetail from './pages/StoryDetail'
import About from './pages/About'
import NotFound from './pages/NotFound'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import StoryEditor from './pages/admin/StoryEditor'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Identity sends the browser back to whichever page started the sign-in, and
  // falls back to the site root. Finish the handshake wherever it lands so a
  // token — or a refusal — is never left stranded in the address bar.
  useEffect(() => {
    if (!hasAuthCallback()) return
    consumeAuthCallback().then(() => {
      if (!window.location.pathname.startsWith('/admin')) navigate('/admin', { replace: true })
    })
  }, [navigate])

  return (
    <>
      {!isAdminRoute && <Nav />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:slug" element={<StoryDetail />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stories/new"
            element={
              <ProtectedRoute>
                <StoryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stories/:slug/edit"
            element={
              <ProtectedRoute>
                <StoryEditor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer variant={isAdminRoute ? 'minimal' : 'full'} />
    </>
  )
}
