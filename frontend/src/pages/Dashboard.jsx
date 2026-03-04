import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <h2>Agency CRM</h2>
        <div style={{ padding: '0 1.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#bbb' }}>
          <p>{user?.firstName} {user?.lastName}</p>
          <p>{user?.email}</p>
          <p style={{ textTransform: 'uppercase', color: '#fff', marginTop: '0.5rem' }}>
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
        <ul>
          <li>📊 Dashboard</li>
          <li>🎯 Leads</li>
          <li>👨‍🎓 Students</li>
          <li>✅ Tasks</li>
          <li>💰 Invoices</li>
          <li>👥 HR</li>
          <li>💬 Messages</li>
          <li>📈 Reports</li>
          {isSuperAdmin && <li>⚙️ Settings</li>}
        </ul>
        <div style={{ padding: '1rem 1.5rem', marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
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

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '10px',
              marginTop: '2rem',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ marginBottom: '1rem' }}>Quick Stats</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>Conversion Rate</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>
                    {stats.overview?.conversionRate || 0}%
                  </p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>Task Completion Rate</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>
                    {stats.overview?.taskCompletionRate || 0}%
                  </p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>Active Users</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>
                    {stats.overview?.activeUsers || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>Paid Invoices</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>
                    {stats.overview?.paidInvoices || 0}
                  </p>
                </div>
              </div>
            </div>

            {stats.recentActivities && stats.recentActivities.length > 0 && (
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '10px',
                marginTop: '2rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ marginBottom: '1rem' }}>Recent Activities</h2>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {stats.recentActivities.map((activity, index) => (
                    <div key={index} style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid #eee',
                      fontSize: '0.875rem'
                    }}>
                      <p style={{ fontWeight: '600', color: '#333' }}>
                        {activity.user?.firstName} {activity.user?.lastName}
                      </p>
                      <p style={{ color: '#666' }}>{activity.description}</p>
                      <p style={{ color: '#999', fontSize: '0.75rem' }}>
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
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
      </main>
    </div>
  );
};

export default Dashboard;
