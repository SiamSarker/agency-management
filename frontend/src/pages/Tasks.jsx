import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { taskAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending: '#f39c12', in_progress: '#3498db', completed: '#27ae60',
  cancelled: '#95a5a6', delayed: '#e74c3c',
}
const PRIORITY_COLORS = { low: '#95a5a6', medium: '#3498db', high: '#e67e22', urgent: '#e74c3c' }
const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled', 'delayed']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const CATEGORIES = ['lead_followup', 'student_support', 'documentation', 'meeting', 'other']

const emptyForm = {
  title: '', description: '', priority: 'medium',
  dueDate: '', category: 'other',
}

const Tasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    try {
      const res = await taskAPI.getAll()
      setTasks(res.data.data || [])
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await taskAPI.create({ ...form, assignedTo: [user._id], assignedBy: user._id })
      toast.success('Task created!')
      setShowModal(false)
      setForm(emptyForm)
      fetchTasks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await taskAPI.update(id, { status })
      setTasks(tasks.map(t => t._id === id ? { ...t, status } : t))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await taskAPI.delete(id)
      setTasks(tasks.filter(t => t._id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const filtered = tasks.filter(t => {
    const matchStatus = !statusFilter || t.status === statusFilter
    const matchPriority = !priorityFilter || t.priority === priorityFilter
    return matchStatus && matchPriority
  })

  const isOverdue = (task) =>
    task.dueDate && task.status !== 'completed' && task.status !== 'cancelled' &&
    new Date(task.dueDate) < new Date()

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        <button onClick={() => setShowModal(true)} style={btnStyle}>+ Add Task</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={inputStyle}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      <div style={tableWrap}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Title', 'Category', 'Priority', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No tasks found</td></tr>
              ) : filtered.map(task => (
                <tr key={task._id} style={{ borderBottom: '1px solid #eee', background: isOverdue(task) ? '#fff8f8' : undefined }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600' }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '2px' }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                  </td>
                  <td style={tdStyle}>{task.category?.replace('_', ' ') || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ background: PRIORITY_COLORS[task.priority], color: 'white', borderRadius: '4px', padding: '3px 8px', fontWeight: '600', fontSize: '0.75rem' }}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: isOverdue(task) ? '#e74c3c' : undefined }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    {isOverdue(task) && <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>⚠ Overdue</span>}
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task._id, e.target.value)}
                      style={{
                        background: STATUS_COLORS[task.status], color: 'white',
                        border: 'none', borderRadius: '4px', padding: '3px 8px',
                        cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem',
                      }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(task._id)} style={deleteBtnStyle}>Delete</button>
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
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Task</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input placeholder="Title *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Due Date *</label>
                  <input type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm) }} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Create Task'}</button>
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
const deleteBtnStyle = { padding: '4px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }
const inputStyle = { padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
const tableWrap = { background: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }
const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.9rem' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal = { background: 'white', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }

export default Tasks
