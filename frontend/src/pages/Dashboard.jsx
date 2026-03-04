import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h1>Welcome back, {user?.firstName}! 👋</h1>

      {loading ? (
        <p>Loading dashboard data...</p>
      ) : stats ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Leads</h3>
              <p className="stat-number">{stats.overview?.totalLeads || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Students</h3>
              <p className="stat-number">{stats.overview?.totalStudents || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Tasks</h3>
              <p className="stat-number">{stats.overview?.pendingTasks || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">${stats.revenue?.totalRevenue?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '10px', marginTop: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Quick Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Conversion Rate', value: `${stats.overview?.conversionRate || 0}%` },
                { label: 'Task Completion Rate', value: `${stats.overview?.taskCompletionRate || 0}%` },
                { label: 'Active Users', value: stats.overview?.activeUsers || 0 },
                { label: 'Paid Invoices', value: stats.overview?.paidInvoices || 0 },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>{item.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {stats.recentActivities?.length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '10px', marginTop: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginBottom: '1rem' }}>Recent Activities</h2>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {stats.recentActivities.map((activity, index) => (
                  <div key={index} style={{ padding: '0.75rem', borderBottom: '1px solid #eee', fontSize: '0.875rem' }}>
                    <p style={{ fontWeight: '600', color: '#333' }}>
                      {activity.user?.firstName} {activity.user?.lastName}
                    </p>
                    <p style={{ color: '#666' }}>{activity.description}</p>
                    <p style={{ color: '#999', fontSize: '0.75rem' }}>{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="info">
          <p>Unable to load dashboard data. Please try refreshing the page.</p>
        </div>
      )}
    </Layout>
  )
}

export default Dashboard
