import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { studentAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  active: '#27ae60', inactive: '#95a5a6', graduated: '#3498db',
  suspended: '#e74c3c', withdrawn: '#e67e22',
}

const PROGRAMS = ['MBA Program', 'Computer Science', 'Data Science', 'Engineering', 'Business Administration', 'Medicine', 'Law', 'Psychology', 'Architecture', 'Marketing']

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', program: 'MBA Program',
  studentId: '', gender: 'male', nationality: '',
}

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll()
      setStudents(res.data.data || [])
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const generateStudentId = () => {
    const num = String(Math.floor(Math.random() * 9000) + 1000)
    return `STU-${num}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, password: 'student123', studentId: form.studentId || generateStudentId() }
      await studentAPI.create(data)
      toast.success('Student created!')
      setShowModal(false)
      setForm(emptyForm)
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return
    try {
      await studentAPI.delete(id)
      setStudents(students.filter(s => s._id !== id))
      toast.success('Student deleted')
    } catch {
      toast.error('Failed to delete student')
    }
  }

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      `${s.firstName} ${s.lastName} ${s.email} ${s.studentId}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || s.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Students</h1>
        <button onClick={() => setShowModal(true)} style={btnStyle}>+ Add Student</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          placeholder="Search by name, email or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '200px' }}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div style={tableWrap}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Student ID', 'Name', 'Email', 'Phone', 'Program', 'Status', 'Enrolled', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><code>{s.studentId}</code></td>
                  <td style={tdStyle}>{s.firstName} {s.lastName}</td>
                  <td style={tdStyle}>{s.email}</td>
                  <td style={tdStyle}>{s.phone}</td>
                  <td style={tdStyle}>{s.program}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: STATUS_COLORS[s.status], color: 'white',
                      borderRadius: '4px', padding: '3px 8px',
                      fontWeight: '600', fontSize: '0.75rem',
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : '—'}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(s._id)} style={deleteBtnStyle}>Delete</button>
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
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Student</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input placeholder="First Name *" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputStyle} />
                <input placeholder="Last Name *" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} />
                <input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                <input placeholder="Phone *" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                <input placeholder="Student ID (auto if blank)" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} style={inputStyle} />
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={inputStyle}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} style={{ ...inputStyle, gridColumn: '1 / -1' }}>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input placeholder="Nationality" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>Default password: student123</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm) }} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Create Student'}</button>
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
const modal = { background: 'white', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }

export default Students
