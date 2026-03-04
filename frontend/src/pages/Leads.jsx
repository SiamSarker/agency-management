import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { leadAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  new: '#3498db', contacted: '#f39c12', qualified: '#9b59b6',
  proposal: '#1abc9c', negotiation: '#e67e22', converted: '#27ae60', lost: '#e74c3c',
}

const SOURCES = ['facebook', 'instagram', 'linkedin', 'twitter', 'website', 'referral', 'other']
const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost']

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  source: 'website', interestedIn: '', country: '', city: '', notes: '',
}

const Leads = () => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchLeads() }, [])

  const fetchLeads = async () => {
    try {
      const res = await leadAPI.getAll()
      setLeads(res.data.data || [])
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await leadAPI.create(form)
      toast.success('Lead created!')
      setShowModal(false)
      setForm(emptyForm)
      fetchLeads()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lead')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await leadAPI.update(id, { status })
      setLeads(leads.map(l => l._id === id ? { ...l, status } : l))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    try {
      await leadAPI.delete(id)
      setLeads(leads.filter(l => l._id !== id))
      toast.success('Lead deleted')
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      `${l.firstName} ${l.lastName} ${l.email}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || l.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Leads</h1>
        <button onClick={() => setShowModal(true)} style={btnStyle}>+ Add Lead</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={tableWrap}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Name', 'Email', 'Phone', 'Source', 'Interested In', 'Status', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No leads found</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{lead.firstName} {lead.lastName}</td>
                  <td style={tdStyle}>{lead.email}</td>
                  <td style={tdStyle}>{lead.phone}</td>
                  <td style={tdStyle}>{lead.source}</td>
                  <td style={tdStyle}>{lead.interestedIn}</td>
                  <td style={tdStyle}>
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead._id, e.target.value)}
                      style={{
                        background: STATUS_COLORS[lead.status], color: 'white',
                        border: 'none', borderRadius: '4px', padding: '3px 8px',
                        cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem',
                      }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(lead._id)} style={deleteBtnStyle}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Lead</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input placeholder="First Name *" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputStyle} />
                <input placeholder="Last Name *" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} />
                <input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                <input placeholder="Phone *" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={inputStyle}>
                  {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <input placeholder="Interested In *" required value={form.interestedIn} onChange={e => setForm({ ...form, interestedIn: e.target.value })} style={inputStyle} />
                <input placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={inputStyle} />
                <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
              </div>
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm) }} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Create Lead'}</button>
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

export default Leads
