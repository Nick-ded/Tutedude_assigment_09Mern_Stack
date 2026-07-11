import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Building, Calendar, Clock, CheckCircle2, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import axios from 'axios';

const STEPS = ['Your Details', 'Appointment', 'Confirm'];

export default function VisitorRegister() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [hosts, setHosts]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [errors, setErrors]     = useState({});
  const [serverErr, setServerErr] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', photo: null,
    hostEmail: '', purpose: '', scheduledDate: '', scheduledTime: '', notes: ''
  });

  useEffect(() => {
    axios.get('/api/users/hosts').then(r => setHosts(r.data)).catch(() => {});
  }, []);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErrors(p => ({ ...p, photo: 'Select an image file' })); return; }
    if (f.size > 5e6) { setErrors(p => ({ ...p, photo: 'Max 5 MB' })); return; }
    set('photo', f);
  };

  const validate0 = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validate1 = () => {
    const e = {};
    if (!form.hostEmail)        e.hostEmail     = 'Select a host';
    if (!form.purpose.trim())   e.purpose       = 'Required';
    if (!form.scheduledDate)    e.scheduledDate = 'Required';
    if (!form.scheduledTime)    e.scheduledTime = 'Required';
    if (form.scheduledDate && form.scheduledTime) {
      if (new Date(`${form.scheduledDate}T${form.scheduledTime}`) <= new Date())
        e.scheduledDate = 'Must be a future date & time';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (step === 0 && validate0()) setStep(1);
    if (step === 1 && validate1()) setStep(2);
  };

  const submit = async () => {
    setLoading(true);
    setServerErr('');
    try {
      const fd = new FormData();
      ['name','email','phone','company','hostEmail','purpose','notes'].forEach(k => fd.append(k, form[k]));
      fd.append('scheduledDate', new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString());
      if (form.photo) fd.append('photo', form.photo);
      await axios.post('/api/appointments/pre-register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDone(true);
    } catch (e) {
      setServerErr(e.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (done) return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel glow-card animate-fade-up" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--success)' }} />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>You're all set!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.8' }}>
          Your visit request has been sent to <strong style={{ color: 'var(--text)' }}>{form.hostEmail}</strong>.<br />
          You'll receive a QR pass by email once approved.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
          {['Request sent to host for approval', 'Confirmation email will be sent', 'QR code pass will be generated'].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t}</span>
            </div>
          ))}
        </div>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
          Go to Staff Login <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  const selectedHost = hosts.find(h => h.email === form.hostEmail);

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-fade-up">
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
            Pre-register your <span className="gradient-text">visit</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Book your appointment in advance and get a QR pass</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '0.875rem',
                  background: i < step ? 'var(--success)' : i === step ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--surface2)',
                  border: i === step ? 'none' : `1px solid ${i < step ? 'var(--success)' : 'var(--border)'}`,
                  color: i <= step ? 'white' : 'var(--text-dim)',
                  boxShadow: i === step ? '0 0 15px rgba(99,102,241,0.5)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.7rem', color: i === step ? 'var(--primary-light)' : 'var(--text-dim)', fontWeight: i === step ? '600' : '400', whiteSpace: 'nowrap' }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ height: '2px', flex: 1, background: i < step ? 'var(--success)' : 'var(--border)', transition: 'background 0.3s', marginBottom: '1.2rem' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="glass-panel glow-card animate-fade-up">
          {/* STEP 0 — Personal details */}
          {step === 0 && (
            <>
              <h3 style={{ marginBottom: '1.5rem' }}>Tell us about yourself</h3>

              <Row>
                <Field label="Full Name" icon={<User size={14} />} error={errors.name} required>
                  <input className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
                </Field>
              </Row>
              <Row cols={2}>
                <Field label="Email" icon={<Mail size={14} />} error={errors.email} required>
                  <input className="form-input" type="email" placeholder="jane@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </Field>
                <Field label="Phone" icon={<Phone size={14} />} error={errors.phone} required>
                  <input className="form-input" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Company / Organisation" icon={<Building size={14} />}>
                  <input className="form-input" placeholder="Acme Corp (optional)" value={form.company} onChange={e => set('company', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Photo" icon={<Upload size={14} />} error={errors.photo}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: '10px',
                    background: 'rgba(15,23,42,0.8)', border: '1px dashed var(--border)',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}>
                    <Upload size={18} style={{ color: 'var(--text-dim)' }} />
                    <span style={{ color: form.photo ? 'var(--primary-light)' : 'var(--text-dim)', fontSize: '0.9rem' }}>
                      {form.photo ? form.photo.name : 'Click to upload photo (optional, max 5 MB)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                  </label>
                </Field>
              </Row>
            </>
          )}

          {/* STEP 1 — Appointment */}
          {step === 1 && (
            <>
              <h3 style={{ marginBottom: '1.5rem' }}>Schedule your appointment</h3>

              <Row>
                <Field label="Host / Person to Meet" error={errors.hostEmail} required>
                  <select className="form-input" value={form.hostEmail} onChange={e => set('hostEmail', e.target.value)}>
                    <option value="">Select a host…</option>
                    {hosts.map(h => (
                      <option key={h._id} value={h.email}>{h.name} — {h.email}</option>
                    ))}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Purpose of Visit" error={errors.purpose} required>
                  <textarea className="form-input" rows={3} placeholder="e.g. Business meeting, Interview, Delivery…" value={form.purpose} onChange={e => set('purpose', e.target.value)} />
                </Field>
              </Row>
              <Row cols={2}>
                <Field label="Date" icon={<Calendar size={14} />} error={errors.scheduledDate} required>
                  <input className="form-input" type="date" min={new Date().toISOString().split('T')[0]} value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} />
                </Field>
                <Field label="Time" icon={<Clock size={14} />} error={errors.scheduledTime} required>
                  <input className="form-input" type="time" value={form.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Additional Notes">
                  <textarea className="form-input" rows={2} placeholder="Any special requirements…" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </Field>
              </Row>
            </>
          )}

          {/* STEP 2 — Confirm */}
          {step === 2 && (
            <>
              <h3 style={{ marginBottom: '1.5rem' }}>Confirm your details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Name',       value: form.name },
                  { label: 'Email',      value: form.email },
                  { label: 'Phone',      value: form.phone },
                  { label: 'Company',    value: form.company || '—' },
                  { label: 'Host',       value: selectedHost ? `${selectedHost.name} (${selectedHost.email})` : form.hostEmail },
                  { label: 'Purpose',    value: form.purpose },
                  { label: 'Date & Time', value: form.scheduledDate && form.scheduledTime ? new Date(`${form.scheduledDate}T${form.scheduledTime}`).toLocaleString() : '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ width: '90px', flexShrink: 0, color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: '500', paddingTop: '0.05rem' }}>{row.label}</span>
                    <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: '500' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {serverErr && (
                <div style={{ padding: '0.9rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  ⚠️ {serverErr}
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            {step > 0 && (
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {step < 2 ? (
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={next}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 2, padding: '0.85rem' }} onClick={submit} disabled={loading}>
                {loading
                  ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Submitting…</>
                  : <>Submit Registration <ArrowRight size={16} /></>
                }
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
          Already a staff member?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: '600' }}>Login here →</Link>
        </p>
      </div>
    </div>
  );
}

/* ── tiny layout helpers ── */
const Row = ({ children, cols = 1 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem' }}>
    {children}
  </div>
);

const Field = ({ label, icon, error, required, children }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    <label className="form-label">
      {icon}{label}{required && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.3rem' }}>{error}</p>}
  </div>
);
