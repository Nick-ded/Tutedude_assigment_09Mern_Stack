// Dashboard.jsx
// shows stats, appointments and visitors after login
// todo: add charts later maybe with recharts

import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import api from '../api'
import { Users, UserCheck, Calendar, AlertCircle, Search, RefreshCw, Download, FileText, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'

// helper to format date nicely
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// status color/icon lookup - probably could do this cleaner
const STATUS = {
  Pending:  { badge: 'badge-warning', icon: <Clock size={11} /> },
  Approved: { badge: 'badge-success', icon: <CheckCircle2 size={11} /> },
  Rejected: { badge: 'badge-danger',  icon: <XCircle size={11} /> },
}

// small avatar with initials - generates a color based on name
function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  // simple hash to get a consistent hue
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: `hsl(${hue},50%,22%)`,
      border: `1px solid hsl(${hue},50%,38%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.72rem', fontWeight: 700,
      color: `hsl(${hue},70%,80%)`
    }}>
      {initials}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  const [appointments, setAppointments] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchText, setSearchText] = useState('')

  // load data on mount
  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll(quiet = false) {
    if (quiet) setRefreshing(true)
    else setLoading(true)

    try {
      // fetch both at the same time
      const [aptRes, visRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/visitors'),
      ])
      setAppointments(aptRes.data)
      setVisitors(visRes.data)
    } catch (err) {
      console.log('fetch error:', err.message)
      // TODO: show a proper error message to user
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleApprove(id) {
    try {
      await api.put(`/appointments/${id}/approve`)
      fetchAll(true)
    } catch (err) {
      console.log('approve failed:', err.message)
      alert('Could not approve appointment')
    }
  }

  async function handleReject(id) {
    try {
      await api.put(`/appointments/${id}/reject`)
      fetchAll(true)
    } catch (err) {
      console.log('reject failed:', err.message)
    }
  }

  // export check logs as csv file
  async function handleExportCSV() {
    try {
      const res = await api.get('/checklogs/export', { responseType: 'blob' })
      // create a temp link to trigger download
      const url = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'checklogs.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.log('csv export error:', err)
      alert('Export failed')
    }
  }

  // download pdf pass for an approved appointment
  async function handleDownloadPDF(apt) {
    try {
      // first find the pass id for this appointment
      const passRes = await api.get(`/passes/appointment/${apt._id}`)
      const passId = passRes.data._id
      // then download the pdf
      const res = await api.get(`/passes/${passId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `pass-${apt.visitor?.name || 'visitor'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.log('pdf error:', err)
      alert('No pass found for this appointment')
    }
  }

  const todayStr = new Date().toDateString()

  // stats calculations
  const stats = [
    {
      label: 'Total Visitors',
      value: visitors.length,
      icon: <Users size={20} />,
      color: 'indigo',
    },
    {
      label: 'Active Passes',
      value: appointments.filter(a => a.status === 'Approved').length,
      icon: <UserCheck size={20} />,
      color: 'emerald',
    },
    {
      label: "Today's Visits",
      value: appointments.filter(a => new Date(a.expectedDate).toDateString() === todayStr).length,
      icon: <Calendar size={20} />,
      color: 'cyan',
    },
    {
      label: 'Pending Approval',
      value: appointments.filter(a => a.status === 'Pending').length,
      icon: <AlertCircle size={20} />,
      color: 'violet',
    },
  ]

  const filteredVisitors = visitors.filter(v => {
    const q = searchText.toLowerCase()
    return v.name.toLowerCase().includes(q)
      || v.email.toLowerCase().includes(q)
      || (v.company || '').toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container animate-fade-up" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

      {/* page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {getGreeting()}, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Here's your facility overview</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* only show export to admin/security */}
          {(user.role === 'Admin' || user.role === 'Security') && (
            <button className="btn btn-ghost" onClick={handleExportCSV} title="Download check logs as CSV">
              <Download size={15} /> Export CSV
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => fetchAll(true)} disabled={refreshing}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: '1.2rem', marginBottom: '2rem' }}
        className="stagger">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.color} animate-fade-up`}>
            <div className="stat-icon">{s.icon}</div>
            <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.3rem' }}>
              {s.value}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* tab buttons */}
      <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(15,23,42,0.7)', padding: '0.3rem', borderRadius: '10px', width: 'fit-content', border: '1px solid rgba(99,102,241,0.12)', marginBottom: '1.5rem' }}>
        {['overview', 'appointments', 'visitors'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '0.5rem 1.2rem', borderRadius: '7px', border: 'none', fontFamily: 'inherit',
            fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
            background: activeTab === tab ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
            color: activeTab === tab ? 'white' : '#64748b',
            fontWeight: activeTab === tab ? 600 : 400,
            boxShadow: activeTab === tab ? '0 4px 10px rgba(99,102,241,0.35)' : 'none',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div className="glass-panel">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Recent Appointments</h3>
              <p style={{ color: '#475569', fontSize: '0.78rem' }}>latest 6</p>
            </div>
            {appointments.length === 0
              ? <EmptyState text="No appointments yet" />
              : appointments.slice(0, 6).map(apt => (
                <AppointmentRow
                  key={apt._id}
                  apt={apt}
                  user={user}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPDF={handleDownloadPDF}
                />
              ))
            }
            {appointments.length > 6 && (
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', fontSize: '0.82rem' }}
                onClick={() => setActiveTab('appointments')}>
                View all {appointments.length} <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>All Appointments</h3>
              <p style={{ color: '#475569', fontSize: '0.78rem' }}>{appointments.length} total</p>
            </div>
            {appointments.length === 0
              ? <EmptyState text="No appointments" />
              : appointments.map(apt => (
                <AppointmentRow
                  key={apt._id}
                  apt={apt}
                  user={user}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPDF={handleDownloadPDF}
                />
              ))
            }
          </div>
        )}

        {/* VISITORS TAB */}
        {activeTab === 'visitors' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Visitor Registry</h3>
                <p style={{ color: '#475569', fontSize: '0.78rem' }}>{visitors.length} registered</p>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.7rem', color: '#475569', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '2.1rem', width: 240 }}
                  placeholder="Search name, email, company..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.length === 0
                    ? <tr><td colSpan={5}><EmptyState text="No visitors match" /></td></tr>
                    : filteredVisitors.map(v => (
                      <tr key={v._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <Avatar name={v.name} />
                            <span style={{ fontWeight: 500 }}>{v.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{v.email}</td>
                        <td style={{ color: '#64748b' }}>{v.phone}</td>
                        <td>{v.company ? <span className="chip">{v.company}</span> : <span style={{ color: '#334155' }}>—</span>}</td>
                        <td style={{ color: '#334155', fontSize: '0.78rem' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// single appointment row component
function AppointmentRow({ apt, user, onApprove, onReject, onPDF }) {
  const meta = STATUS[apt.status] || STATUS.Pending
  const canApproveReject = apt.status === 'Pending' && (user.role === 'Admin' || user.role === 'Employee')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.9rem',
      padding: '0.9rem 0', borderBottom: '1px solid rgba(30,41,59,0.9)',
      flexWrap: 'wrap',
    }}>
      <Avatar name={apt.visitor?.name || '?'} />

      <div style={{ flex: 1, minWidth: 150 }}>
        <p style={{ fontWeight: 600, marginBottom: '0.1rem', fontSize: '0.9rem' }}>
          {apt.visitor?.name || 'Unknown'}
        </p>
        <p style={{ fontSize: '0.76rem', color: '#475569' }}>
          Host: {apt.host?.name || '—'} &nbsp;·&nbsp; {formatDate(apt.expectedDate)}
        </p>
      </div>

      <p style={{ flex: 1, minWidth: 120, fontSize: '0.82rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {apt.purpose}
      </p>

      <span className={`badge ${meta.badge}`}>
        {meta.icon} {apt.status}
      </span>

      <div style={{ display: 'flex', gap: '0.35rem' }}>
        {canApproveReject && (
          <>
            <button className="btn btn-success" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
              onClick={() => onApprove(apt._id)}>
              Approve
            </button>
            <button className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
              onClick={() => onReject(apt._id)}>
              Reject
            </button>
          </>
        )}
        {apt.status === 'Approved' && (
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', border: '1px solid rgba(99,102,241,0.2)' }}
            onClick={() => onPDF(apt)}
            title="Download PDF pass">
            <FileText size={13} /> PDF
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#334155' }}>
      <p style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📭</p>
      <p style={{ fontSize: '0.875rem' }}>{text}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
