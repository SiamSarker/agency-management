import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { userAPI, authAPI } from '../services/api'
import toast from 'react-hot-toast'

const ROLE_COLORS = {
  super_admin: '#9b59b6', admin: '#3498db', manager: '#1abc9c',
  staff: '#27ae60', counsellor: '#e67e22',
}

const ROLES = ['staff', 'counsellor', 'manager', 'admin']

const emptyForm = {
  firstName: '', lastName: '', email: '', password: 'staff123',
  role: 'staff', position: '', department: '',
}

const HR = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll()
      setUsers(res.data.data || [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.register(form)
      toast.success('Staff member created!')
      setShowModal(false)
      setForm(emptyForm)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (id, isActive) => {
    try {
      await userAPI.update(id, { isActive: !isActive })
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !isActive } : u))
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update user')
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>HR — Staff</h1>
        <button onClick={() => setShowModal(true)} style={btnStyle}>+ Add Staff</button>
      </div>

      <div style={tableWrap}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Name', 'Email', 'Role', 'Position', 'Department', 'Last Login', 'Status', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{u.firstName} {u.lastName}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: ROLE_COLORS[u.role] || '#95a5a6', color: 'white',
                      borderRadius: '4px', padding: '3px 8px', fontWeight: '600', fontSize: '0.75rem',
                    }}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={tdStyle}>{u.position || '—'}</td>
                  <td style={tdStyle}>{u.department || '—'}</td>
                  <td style={tdStyle}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: u.isActive ? '#27ae60' : '#e74c3c', color: 'white',
                      borderRadius: '4px', padding: '3px 8px', fontWeight: '600', fontSize: '0.75rem',
                    }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleToggleStatus(u._id, u.isActive)}
                      style={{ ...actionBtnStyle, background: u.isActive ? '#e67e22' : '#27ae60' }}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add Staff Member</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input placeholder="First Name *" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputStyle} />
                <input placeholder="Last Name *" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} />
                <input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                <input type="password" placeholder="Password *" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <input placeholder="Position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} style={inputStyle} />
                <input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm) }} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Create Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

const btnStyle = { padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
const cancelBtnStyle = { padding: '0.6rem 1.2rem', background: '#eee', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
const actionBtnStyle = { padding: '4px 10px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }
const inputStyle = { padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
const tableWrap = { background: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }
const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.9rem' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal = { background: 'white', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }

export default HR
