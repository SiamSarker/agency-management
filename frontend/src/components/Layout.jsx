import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: '📊 Dashboard' },
  { path: '/leads', label: '🎯 Leads' },
  { path: '/students', label: '👨‍🎓 Students' },
  { path: '/tasks', label: '✅ Tasks' },
  { path: '/invoices', label: '💰 Invoices' },
  { path: '/hr', label: '👥 HR' },
  { path: '/messages', label: '💬 Messages' },
  { path: '/reports', label: '📈 Reports' },
]

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isSuperAdmin } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const items = isSuperAdmin
    ? [...navItems, { path: '/settings', label: '⚙️ Settings' }]
    : navItems

  return (
    <div className="dashboard">
      <nav className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2>Agency CRM</h2>
        <div style={{ padding: '0 1.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#bbb' }}>
          <p>{user?.firstName} {user?.lastName}</p>
          <p>{user?.email}</p>
          <p style={{ textTransform: 'uppercase', color: '#fff', marginTop: '0.5rem' }}>
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
        <ul style={{ flex: 1 }}>
          {items.map(item => (
            <li
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: location.pathname === item.path ? '#34495e' : undefined,
                borderLeft: location.pathname === item.path ? '3px solid #667eea' : '3px solid transparent',
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div style={{ padding: '1rem 1.5rem' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '0.75rem', background: '#e74c3c',
              color: 'white', border: 'none', borderRadius: '5px',
              cursor: 'pointer', fontWeight: '600',
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout
