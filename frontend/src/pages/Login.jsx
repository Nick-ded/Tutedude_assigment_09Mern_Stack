import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Shield, Zap, Users, QrCode } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.message);
  };

  const quickFill = (role) => {
    const creds = {
      admin:    { email: 'admin@example.com',    password: 'password123' },
      security: { email: 'security@example.com', password: 'password123' },
      employee: { email: 'john@example.com',     password: 'password123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Left panel ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '-100px', left: '-100px', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
          bottom: '-50px', right: '-50px', pointerEvents: 'none'
        }} />

        <div className="animate-fade-up">
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 25px rgba(99,102,241,0.6)'
            }}>
              <Shield size={24} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #818cf8, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PassGuard
            </span>
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1rem' }}>
            Welcome<br />
            <span className="gradient-text">back.</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2.5rem', maxWidth: '340px', lineHeight: '1.7' }}>
            Sign in to manage visitor passes, appointments, and security logs.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: <QrCode size={16} />, text: 'QR-code powered visitor passes' },
              { icon: <Users size={16} />, text: 'Role-based access for staff' },
              { icon: <Zap size={16} />, text: 'Real-time check-in & check-out' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                color: 'var(--text-muted)', fontSize: '0.9rem',
                animation: `fadeUp 0.5s ease-out ${0.1 + i * 0.1}s both`
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-light)', flexShrink: 0
                }}>
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'rgba(10,22,40,0.5)',
        borderLeft: '1px solid var(--border)',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-up">
          <div className="glass-panel glow-card" style={{ position: 'relative' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Sign in</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Enter your credentials to continue
            </p>

            {error && (
              <div style={{
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label"><Mail size={14} /> Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label"><Lock size={14} /> Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Signing in...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Sign In <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
              <div style={{ height: '1px', background: 'var(--border)', position: 'absolute', inset: '50% 0 auto' }} />
              <span style={{ position: 'relative', background: 'var(--surface)', padding: '0 0.75rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                Quick fill demo
              </span>
            </div>

            {/* Demo quick-fill */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                { label: '👑 Admin', role: 'admin' },
                { label: '🛡️ Security', role: 'security' },
                { label: '👤 Employee', role: 'employee' },
              ].map(({ label, role }) => (
                <button
                  key={role}
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.25rem', justifyContent: 'center' }}
                  onClick={() => quickFill(role)}
                >
                  {label}
                </button>
              ))}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              Not staff?{' '}
              <Link to="/register-visitor" style={{ color: 'var(--primary-light)', fontWeight: '600' }}>
                Pre-register your visit →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
