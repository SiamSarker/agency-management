import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { invoiceAPI, studentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  draft: '#95a5a6', sent: '#3498db', paid: '#27ae60',
  partially_paid: '#f39c12', overdue: '#e74c3c', cancelled: '#7f8c8d',
}

const Invoices = () => {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({
    studentId: '', invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '', description: '', amount: '', notes: '',
  })

  useEffect(() => {
    fetchInvoices()
    fetchStudents()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await invoiceAPI.getAll()
      setInvoices(res.data.data || [])
    } catch {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll()
      setStudents(res.data.data || [])
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const amount = parseFloat(form.amount)
      const invoiceNumber = `INV-${Date.now()}`
      await invoiceAPI.create({
        invoiceNumber,
        student: form.studentId,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        items: [{ description: form.description, quantity: 1, unitPrice: amount, amount }],
        subtotal: amount,
        tax: { rate: 0, amount: 0 },
        total: amount,
        notes: form.notes,
        createdBy: user._id,
      })
      toast.success('Invoice created!')
      setShowModal(false)
      setForm({ studentId: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', description: '', amount: '', notes: '' })
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await invoiceAPI.updateStatus(id, status)
      setInvoices(invoices.map(i => i._id === id ? { ...i, status } : i))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    try {
      await invoiceAPI.delete(id)
      setInvoices(invoices.filter(i => i._id !== id))
      toast.success('Invoice deleted')
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const filtered = statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0)

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Invoices</h1>
        <button onClick={() => setShowModal(true)} style={btnStyle}>+ New Invoice</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Invoices', value: invoices.length, color: '#667eea' },
          { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: '#27ae60' },
          { label: 'Pending', value: invoices.filter(i => ['sent', 'draft'].includes(i.status)).length, color: '#f39c12' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#27ae60' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#666', fontSize: '0.8rem', margin: 0, marginBottom: '4px' }}>{card.label}</p>
            <p style={{ color: card.color, fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '200px' }}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div style={tableWrap}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Invoice #', 'Student', 'Date', 'Due Date', 'Total', 'Paid', 'Status', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No invoices found</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><code>{inv.invoiceNumber}</code></td>
                  <td style={tdStyle}>
                    {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : '—'}
                  </td>
                  <td style={tdStyle}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td style={tdStyle}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>${inv.total?.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: '#27ae60', fontWeight: '600' }}>${inv.paidAmount?.toLocaleString() || 0}</td>
                  <td style={tdStyle}>
                    <select
                      value={inv.status}
                      onChange={e => handleStatusChange(inv._id, e.target.value)}
                      style={{
                        background: STATUS_COLORS[inv.status], color: 'white',
                        border: 'none', borderRadius: '4px', padding: '3px 8px',
                        cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem',
                      }}
                    >
                      {Object.keys(STATUS_COLORS).map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(inv._id)} style={deleteBtnStyle}>Delete</button>
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
            <h2 style={{ marginBottom: '1.5rem' }}>New Invoice</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Student *</label>
                <select required value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} style={inputStyle}>
                  <option value="">Select a student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                  ))}
                </select>
              </div>
              <input placeholder="Description (e.g. MBA - Semester 1) *" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Amount *" required min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Invoice Date</label>
                  <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Due Date *</label>
                  <input type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Create Invoice'}</button>
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
const modal = { background: 'white', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }

export default Invoices
