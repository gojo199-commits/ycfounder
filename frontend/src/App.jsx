import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import Dashboard from './pages/Dashboard'
import Browse from './pages/Browse'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

// Page transition wrapper
function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  )
}

// Protected route — redirects unauthenticated users to /auth
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin" />
          <p className="text-[#FF6600] text-sm font-medium">Loading YFounder...</p>
        </div>
      </div>
    )
  }
  return user ? children : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <PageTransition><AuthPage /></PageTransition>} />
        <Route path="/onboarding" element={<ProtectedRoute><PageTransition><OnboardingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute><PageTransition><Browse /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
