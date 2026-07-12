// VisitorRegister.jsx
// 3 step form for visitors to pre-register before their visit
// step 1: personal info, step 2: appointment details, step 3: confirm

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Building, Calendar, Clock, CheckCircle2, ArrowRight, ArrowLeft, Upload } from 'lucide-react'
import api from '../api'

export default function VisitorRegister() {
  const navigate = useNavigate()

  const [step, setStep]       = useState(0)
  const [hosts, setHosts]     = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [errors, setErrors]   = useState({})
  const [serverErr, setServerErr] = useState('')

  // form state all in one object
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    photo: null,
    hostEmail: '', purpose: '',
    scheduledDate: '', scheduledTime: '',
    notes: '',
  })

  // load hosts list when component mounts
  useEffect(() => {
    api.get('/users/hosts')
      .then(r => {
        setHosts(r.data)
        console.log('hosts loaded:', r.data.length)
      })
      .catch(err => console.log('failed to load hosts:', err.message))
  }, [])

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
    // clear error for this field when user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: 'Please select an image file' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'Image too large (max 5MB)' }))
      return
    }
    updateField('photo', file)
  }

  // validation for step 0
  function validateStep0() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!form.email.includes('@')) errs.email = 'Invalid email'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // validation for step 1
  function validateStep1() {
    const errs = {}
    if (!form.hostEmail) errs.hostEmail = 'Please select a host'
    if (!form.purpose.trim()) errs.purpose = 'Purpose is required'
    if (!form.scheduledDate) errs.scheduledDate = 'Date is required'
    if (!form.scheduledTime) errs.scheduledTime = 'Time is required'
    if (form.scheduledDate && form.scheduledTime) {
      const dt = new Date(`${form.scheduledDate}T${form.scheduledTime}`)
      if (dt <= new Date()) {
        errs.scheduledDate = 'Must be in the future'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goNext() {
    if (step === 0 && validateStep0()) setStep(1)
    else if (step === 1 && validateStep1()) setStep(2)
  }

  async function submitForm() {
    setLoading(true)
    setServerErr('')

    try {
      // use FormData because we might have a photo file
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      fd.append('company', form.company)
      fd.append('hostEmail', form.hostEmail)
      fd.append('purpose', form.purpose)
      fd.append('notes', form.notes)

      // combine date and time into ISO string
      const datetime = new Date(`${form.scheduledDate}T${form.scheduledTime}`)
      fd.append('scheduledDate', datetime.toISOString())

      if (form.photo) {
        fd.append('photo', form.photo)
      }

      await api.post('/appointments/pre-register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setDone(true)
    } catch (err) {
      console.log('submit error:', err.response?.data)
      setServerErr(err.response?.data?.message || 'Something went wrong, try again')
    } finally {
      setLoading(false)
    }
  }

  // success screen
  if (done) {
    return (
      <div className="flex-center animate-fade-up" style={{ minHeight: '85vh', padding: '2rem' }}>
        <div className="glass-panel" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={34} style={{ color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>You're all set!</h2>
          <p style={{ color: '#64748b', marginBottom: '1.75rem', lineHeight: 1.7 }}>
            Your visit request has been sent to the host.<br />
            You'll receive a QR pass by email once they approve.
          </p>
          <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Host notified of your request',
              'Confirmation email sent when approved',
              'QR pass emailed to you',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.85rem', background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.12)', fontSize: '0.875rem', color: '#94a3b8' }}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} /> {item}
              </li>
            ))}
          </ul>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
            Staff Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  const selectedHost = hosts.find(h => h.email === form.hostEmail)

  return (
    <div className="flex-center animate-fade-up" style={{ minHeight: '88vh', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>

        {/* title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Pre-register your <span className="gradient-text">visit</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Book your appointment and get a QR pass</p>
        </div>

        {/* step progress */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.75rem' }}>
          {['Your Details', 'Appointment', 'Review'].map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', fontWeight: 700,
                  background: i < step ? '#10b981' : i === step ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(30,41,59,0.8)',
                  color: i <= step ? 'white' : '#475569',
                  border: i < step ? 'none' : i === step ? 'none' : '1px solid rgba(99,102,241,0.2)',
                  boxShadow: i === step ? '0 0 12px rgba(99,102,241,0.45)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.68rem', color: i === step ? '#818cf8' : '#475569', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ height: 2, flex: 1, background: i < step ? '#10b981' : 'rgba(99,102,241,0.15)', transition: 'background 0.3s', marginBottom: '1.1rem' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="glass-panel">

          {/* STEP 0 - personal info */}
          {step === 0 && (
            <>
              <h3 style={{ marginBottom: '1.4rem' }}>Personal Information</h3>

              <Field label="Full Name" icon={<User size={13} />} error={errors.name} required>
                <input className="form-input" name="name" placeholder="Jane Smith" value={form.name}
                  onChange={e => updateField('name', e.target.value)} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Email" icon={<Mail size={13} />} error={errors.email} required>
                  <input className="form-input" type="email" placeholder="jane@example.com" value={form.email}
                    onChange={e => updateField('email', e.target.value)} />
                </Field>
                <Field label="Phone" icon={<Phone size={13} />} error={errors.phone} required>
                  <input className="form-input" type="tel" placeholder="+1 555 000 0000" value={form.phone}
                    onChange={e => updateField('phone', e.target.value)} />
                </Field>
              </div>

              <Field label="Company (optional)" icon={<Building size={13} />}>
                <input className="form-input" placeholder="Acme Corp" value={form.company}
                  onChange={e => updateField('company', e.target.value)} />
              </Field>

              <Field label="Photo (optional)" icon={<Upload size={13} />} error={errors.photo}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.9rem', borderRadius: 8, background: 'rgba(15,23,42,0.9)', border: '1px dashed rgba(99,102,241,0.2)', cursor: 'pointer' }}>
                  <Upload size={16} style={{ color: '#475569' }} />
                  <span style={{ fontSize: '0.875rem', color: form.photo ? '#818cf8' : '#475569' }}>
                    {form.photo ? form.photo.name : 'Click to upload (max 5MB)'}
                  </span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              </Field>
            </>
          )}

          {/* STEP 1 - appointment details */}
          {step === 1 && (
            <>
              <h3 style={{ marginBottom: '1.4rem' }}>Appointment Details</h3>

              <Field label="Host / Person to Meet" error={errors.hostEmail} required>
                <select className="form-input" value={form.hostEmail}
                  onChange={e => updateField('hostEmail', e.target.value)}>
                  <option value="">Select a host...</option>
                  {hosts.map(h => (
                    <option key={h._id} value={h.email}>{h.name} — {h.email}</option>
                  ))}
                </select>
              </Field>

              <Field label="Purpose of Visit" error={errors.purpose} required>
                <textarea className="form-input" rows={3} placeholder="e.g. Business meeting, Interview..."
                  value={form.purpose} onChange={e => updateField('purpose', e.target.value)} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Date" icon={<Calendar size={13} />} error={errors.scheduledDate} required>
                  <input className="form-input" type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.scheduledDate}
                    onChange={e => updateField('scheduledDate', e.target.value)} />
                </Field>
                <Field label="Time" icon={<Clock size={13} />} error={errors.scheduledTime} required>
                  <input className="form-input" type="time"
                    value={form.scheduledTime}
                    onChange={e => updateField('scheduledTime', e.target.value)} />
                </Field>
              </div>

              <Field label="Notes (optional)">
                <textarea className="form-input" rows={2} placeholder="Any special requirements..."
                  value={form.notes} onChange={e => updateField('notes', e.target.value)} />
              </Field>
            </>
          )}

          {/* STEP 2 - review before submit */}
          {step === 2 && (
            <>
              <h3 style={{ marginBottom: '1.4rem' }}>Review & Submit</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[
                  ['Name',       form.name],
                  ['Email',      form.email],
                  ['Phone',      form.phone],
                  ['Company',    form.company || '—'],
                  ['Host',       selectedHost ? `${selectedHost.name} (${selectedHost.email})` : form.hostEmail],
                  ['Purpose',    form.purpose],
                  ['Date & Time', form.scheduledDate && form.scheduledTime
                    ? new Date(`${form.scheduledDate}T${form.scheduledTime}`).toLocaleString()
                    : '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.6)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.1)' }}>
                    <span style={{ width: 90, flexShrink: 0, color: '#475569', fontSize: '0.78rem', fontWeight: 500, paddingTop: 2 }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>

              {serverErr && (
                <div style={{ padding: '0.8rem', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  ⚠️ {serverErr}
                </div>
              )}
            </>
          )}

          {/* nav buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.4rem', paddingTop: '1.4rem', borderTop: '1px solid rgba(99,102,241,0.12)' }}>
            {step > 0 && (
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {step < 2 ? (
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={goNext}>
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 2, padding: '0.8rem' }} onClick={submitForm} disabled={loading}>
                {loading
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting...</>
                  : <>Submit Registration <ArrowRight size={15} /></>
                }
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.1rem', color: '#475569', fontSize: '0.85rem' }}>
          Already a staff member? <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Login →</Link>
        </p>
      </div>
    </div>
  )
}

// small reusable field wrapper
function Field({ label, icon, error, required, children }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label className="form-label">
        {icon} {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  )
}
