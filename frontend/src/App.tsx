import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/components/DashboardLayout'

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage isRegister />} />
            <Route path="*" element={<Navigate to="/register" />} />
          </>
        ) : (
          <>
            <Route path="/*" element={<DashboardLayout />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
