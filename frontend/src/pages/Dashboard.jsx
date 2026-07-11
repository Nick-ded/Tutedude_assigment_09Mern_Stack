import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  Users, UserCheck, Calendar, QrCode, Search,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, RefreshCw
} from 'lucide-react';

/* ── helpers ── */
const fmtDate = d => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const statusMeta = {
  Pending:  { cls: 'badge-warning', icon: <Clock size={11} /> },
  Approved: { cls: 'badge-success', icon: <CheckCircle2 size={11} /> },
  Rejected: { cls: 'badge-danger',  icon: <XCircle size={11} /> },
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [a, v] = await Promise.all([
        axios.get('/api/appointments'),
        axios.get('/api/visitors'),
      ]);
      setAppointments(a.data);
      setVisitors(v.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const approve = async (id) => { await axios.put(`/api/appointments/${id}/approve`); load(true); };
  const reject  = async (id) => { await axios.put(`/api/appointments/${id}/reject`);  load(true); };

  const today = new Date().toDateString();
  const stats = [
    { label: 'Total Visitors',   value: visitors.length,                                                       icon: <Users size={20} />,      color: 'indigo' },
    { label: 'Active Passes',    value: appointments.filter(a => a.status === 'Approved').length,              icon: <UserCheck size={20} />,  color: 'emerald' },
    { label: "Today's Meetings", value: appointments.filter(a => new Date(a.expectedDate).toDateString()===today).length, icon: <Calendar size={20} />, color: 'cyan' },
    { label: 'Pending Review',   value: appointments.filter(a => a.status === 'Pending').length,               icon: <AlertCircle size={20} />,color: 'violet' },
  ];

  const filteredVisitors = visitors.filter(v =>
    [v.name, v.email, v.company || ''].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="animate-fade-up container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            Good {greeting()},{' '}
            <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Here's what's happening at your facility today.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          style={{ gap: '0.4rem', fontSize: '0.85rem' }}
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}
           className="stagger">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.color} animate-fade-up`}>
            <div className="stat-icon">{s.icon}</div>
            <p style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.3rem' }}>
              {s.value}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '0.25rem', padding: '0.3rem',
        background: 'rgba(15,23,42,0.6)', borderRadius: '12px',
        border: '1px solid var(--border)', marginBottom: '1.5rem',
        width: 'fit-content'
      }}>
        {['overview', 'appointments', 'visitors'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.55rem 1.25rem', borderRadius: '9px', border: 'none',
              background: tab === t ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-muted)',
              fontWeight: tab === t ? '600' : '400',
              fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              boxShadow: tab === t ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="glass-panel glow-card animate-fade-in">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <SectionHeader title="Recent Appointments" subtitle="Latest 6 across the facility" />
            {appointments.length === 0
              ? <Empty text="No appointments yet" />
              : appointments.slice(0, 6).map(a => (
                <AppointmentRow key={a._id} a={a} user={user} onApprove={approve} onReject={reject} />
              ))
            }
            {appointments.length > 6 && (
              <button className="btn btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
                onClick={() => setTab('appointments')}>
                View all {appointments.length} appointments <ChevronRight size={15} />
              </button>
            )}
          </>
        )}

        {/* APPOINTMENTS */}
        {tab === 'appointments' && (
          <>
            <SectionHeader title="All Appointments" subtitle={`${appointments.length} total`} />
            {appointments.length === 0
              ? <Empty text="No appointments found" />
              : appointments.map(a => (
                <AppointmentRow key={a._id} a={a} user={user} onApprove={approve} onReject={reject} />
              ))
            }
          </>
        )}

        {/* VISITORS */}
        {tab === 'visitors' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <SectionHeader title="Visitor Registry" subtitle={`${visitors.length} registered`} noMargin />
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', width: '260px' }}
                  placeholder="Search name, email, company…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.length === 0
                    ? <tr><td colSpan={5}><Empty text="No visitors match your search" /></td></tr>
                    : filteredVisitors.map(v => (
                      <tr key={v._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar name={v.name} />
                            <span style={{ fontWeight: '500' }}>{v.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{v.email}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{v.phone}</td>
                        <td>
                          {v.company
                            ? <span className="chip">{v.company}</span>
                            : <span style={{ color: 'var(--text-dim)' }}>—</span>
                          }
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                          {new Date(v.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function AppointmentRow({ a, user, onApprove, onReject }) {
  const meta = statusMeta[a.status] || statusMeta.Pending;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1rem 0', borderBottom: '1px solid rgba(30,41,59,0.8)',
      flexWrap: 'wrap'
    }}>
      <Avatar name={a.visitor?.name || '?'} />
      <div style={{ flex: 1, minWidth: '160px' }}>
        <p style={{ fontWeight: '600', marginBottom: '0.15rem' }}>{a.visitor?.name || 'Unknown'}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Host: {a.host?.name || '—'} · {fmtDate(a.expectedDate)}
        </p>
      </div>
      <div style={{ flex: 1, minWidth: '140px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.purpose}
        </p>
      </div>
      <span className={`badge ${meta.cls}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {meta.icon}{a.status}
      </span>
      {a.status === 'Pending' && (user.role === 'Admin' || user.role === 'Employee') && (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-success" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }} onClick={() => onApprove(a._id)}>
            Approve
          </button>
          <button className="btn btn-danger" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }} onClick={() => onReject(a._id)}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : '1.5rem' }}>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>{title}</h3>
      {subtitle && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{subtitle}</p>}
    </div>
  );
}

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: '38px', height: '38px', borderRadius: '10px',
      background: `hsl(${hue}, 60%, 30%)`,
      border: `1px solid hsl(${hue}, 60%, 45%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: '700',
      color: `hsl(${hue}, 80%, 85%)`,
      flexShrink: 0
    }}>
      {initials}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
      <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</p>
      <p>{text}</p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
