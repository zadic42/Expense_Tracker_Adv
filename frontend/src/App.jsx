import UserLogin from './pages/UserLogin'
import { Routes, Route, Navigate } from 'react-router-dom'
import UserSignup from './pages/UserSignup'
import ForgotPassword from './pages/ForgotPassword'
import { AppLayout } from './pages/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './contexts/ThemeContext'


function App() {
  return (
    <ThemeProvider>
    <Routes>
      <Route path="/login" element={<UserLogin />} />
      <Route path="/signup" element={<UserSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </ThemeProvider>
  )
}

export default App
