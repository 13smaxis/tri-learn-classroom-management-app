import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LandingPage from './components/landing/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main app shell */}
        <Route path="/" element={<AppLayout />} />

        {/* Public Routes */}
        <Route path="/signup" element={<LandingPage onOpenLogin={() => {}} onOpenRegister={() => {}} onOpenInvite={() => {}} />} />
        <Route path="/signin" element={<LandingPage onOpenLogin={() => {}} onOpenRegister={() => {}} onOpenInvite={() => {}} />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App