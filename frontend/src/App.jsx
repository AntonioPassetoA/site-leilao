import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import usePageTracking from './hooks/useAnalytics'

// Layout
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import CookieConsent from './components/CookieConsent'

// Public Pages
import Home from './pages/Home'
import Search from './pages/Search'
import PropertyDetails from './pages/PropertyDetails'
import HowItWorks from './pages/HowItWorks'
import Login from './pages/Login'
import Register from './pages/Register'
import TermsOfUse from './pages/TermsOfUse'
import PrivacyPolicy from './pages/PrivacyPolicy'

// Protected Pages
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import MyBids from './pages/MyBids'
import Favorites from './pages/Favorites'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProperties from './pages/admin/AdminProperties'
import AdminPropertyForm from './pages/admin/AdminPropertyForm'
import AdminUsers from './pages/admin/AdminUsers'
import AdminScraper from './pages/admin/AdminScraper'
import AdminLeads from './pages/admin/AdminLeads'

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Admin Route wrapper
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { loading } = useAuth()

  // Track page views (respects cookie consent)
  usePageTracking()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="buscar" element={<Search />} />
          <Route path="imovel/:id" element={<PropertyDetails />} />
          <Route path="como-funciona" element={<HowItWorks />} />
          <Route path="termos-de-uso" element={<TermsOfUse />} />
          <Route path="politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="login" element={<Login />} />
          <Route path="cadastro" element={<Register />} />

          {/* Protected User Routes */}
          <Route
            path="minha-conta"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="minha-conta/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="minha-conta/lances"
            element={
              <ProtectedRoute>
                <MyBids />
              </ProtectedRoute>
            }
          />
          <Route
            path="minha-conta/favoritos"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="imoveis" element={<AdminProperties />} />
          <Route path="imoveis/novo" element={<AdminPropertyForm />} />
          <Route path="imoveis/:id/editar" element={<AdminPropertyForm />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="importar" element={<AdminScraper />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Cookie Consent Banner (LGPD) */}
      <CookieConsent />
    </>
  )
}
