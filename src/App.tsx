import { Route, Routes, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Stories from './pages/Stories'
import StoryDetail from './pages/StoryDetail'
import About from './pages/About'
import NotFound from './pages/NotFound'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import StoryEditor from './pages/admin/StoryEditor'

export default function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <Nav />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:slug" element={<StoryDetail />} />
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
      {!isAdminRoute && <Footer />}
    </>
  )
}
