import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Students from './pages/Students'
import Tasks from './pages/Tasks'
import Invoices from './pages/Invoices'
import HR from './pages/HR'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const protect = (component) => <ProtectedRoute>{component}</ProtectedRoute>

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={protect(<Dashboard />)} />
      <Route path="/leads" element={protect(<Leads />)} />
      <Route path="/students" element={protect(<Students />)} />
      <Route path="/tasks" element={protect(<Tasks />)} />
      <Route path="/invoices" element={protect(<Invoices />)} />
      <Route path="/hr" element={protect(<HR />)} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
