import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, XCircle, Clock, User, RefreshCw, Wifi, WifiOff, ScanLine } from 'lucide-react';
import api from '../api';
const axios = api;

export default function SecurityScan() {
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [recentScans, setRecent]    = useState([]);
  const [scannerActive, setActive]  = useState(true);
  const scannerRef = useRef(null);
  const lockRef    = useRef(false); // debounce concurrent scans

  useEffect(() => {
    fetchRecent();
    startScanner();
    return () => scannerRef.current?.clear().catch(() => {});
  }, []);

  const startScanner = () => {
    setTimeout(() => {
      const s = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
        false
      );
      s.render(onScan, () => {});
      scannerRef.current = s;
    }, 150);
  };

  const onScan = async (text) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post('/api/checklogs/scan', { qrCodeData: text });
      setResult({ ok: true, ...data });
      fetchRecent();
    } catch (e) {
      setResult({ ok: false, message: e.response?.data?.message || 'Invalid or unrecognised pass' });
    } finally {
      setLoading(false);
      // allow next scan after 3 s
      setTimeout(() => { lockRef.current = false; }, 3000);
    }
  };

  const fetchRecent = async () => {
    try {
      const { data } = await axios.get('/api/checklogs/recent');
      setRecent(data);
    } catch {}
  };

  const reset = () => { setResult(null); lockRef.current = false; };

  return (
    <div className="animate-fade-up container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(99,102,241,0.3))',
              border: '1px solid rgba(6,182,212,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ScanLine size={20} style={{ color: '#22d3ee' }} />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: 0 }}>Security Scanner</h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Scan visitor QR passes — check-in &amp; check-out detected automatically.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${scannerActive ? 'badge-success' : 'badge-danger'}`}>
            {scannerActive ? <><Wifi size={11} /> Live</> : <><WifiOff size={11} /> Paused</>}
          </span>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={fetchRecent}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Scanner panel ── */}
        <div className="glass-panel glow-card">
          {/* QR viewport */}
          <div style={{
            borderRadius: '16px', overflow: 'hidden',
            border: '1px solid var(--border)',
            background: '#000',
            position: 'relative',
          }}>
            {/* Corner decorations */}
            {['top-left','top-right','bottom-left','bottom-right'].map(pos => {
              const isRight  = pos.includes('right');
              const isBottom = pos.includes('bottom');
              return (
                <div key={pos} style={{
                  position: 'absolute', zIndex: 10,
                  width: '28px', height: '28px',
                  top: isBottom ? 'auto' : '12px',
                  bottom: isBottom ? '12px' : 'auto',
                  left: isRight ? 'auto' : '12px',
                  right: isRight ? '12px' : 'auto',
                  borderTop: !isBottom ? '3px solid #22d3ee' : 'none',
                  borderBottom: isBottom ? '3px solid #22d3ee' : 'none',
                  borderLeft: !isRight ? '3px solid #22d3ee' : 'none',
                  borderRight: isRight ? '3px solid #22d3ee' : 'none',
                  borderRadius: isBottom
                    ? (isRight ? '0 0 6px 0' : '0 0 0 6px')
                    : (isRight ? '0 6px 0 0' : '6px 0 0 0'),
                  pointerEvents: 'none'
                }} />
              );
            })}
            <div id="qr-reader" style={{ width: '100%' }} />
          </div>

          {/* Status area */}
          <div style={{ marginTop: '1.5rem', minHeight: '80px' }}>
            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.25rem', borderRadius: '12px',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <div className="spinner" style={{ borderTopColor: 'var(--warning)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--warning)' }}>Verifying pass…</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Checking validity and logging entry</p>
                </div>
              </div>
            )}

            {!loading && result && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1.25rem', borderRadius: '12px',
                background: result.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${result.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                animation: 'fadeUp 0.3s ease-out',
              }}>
                {result.ok
                  ? <CheckCircle2 size={32} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                  : <XCircle     size={32} style={{ color: 'var(--danger)',  flexShrink: 0, marginTop: '2px' }} />
                }
                <div style={{ flex: 1 }}>
                  {result.ok ? (
                    <>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--success)' }}>
                        {result.type === 'checkin' ? '✅ Checked In Successfully' : '🔚 Checked Out Successfully'}
                      </p>
                      {result.visitorName && (
                        <p style={{ color: 'var(--text)', marginBottom: '0.15rem' }}>
                          <strong>Visitor:</strong> {result.visitorName}
                        </p>
                      )}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{result.message}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem', color: 'var(--danger)' }}>
                        ❌ Access Denied
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.message}</p>
                    </>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ padding: '0.3rem', flexShrink: 0 }} onClick={reset} title="Dismiss">
                  <RefreshCw size={16} />
                </button>
              </div>
            )}

            {!loading && !result && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dim)' }}>
                <p style={{ fontSize: '0.875rem' }}>Point camera at a visitor's QR code pass</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: 0, fontSize: '1rem' }}>Recent Activity</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Last 20</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {recentScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</p>
                <p style={{ fontSize: '0.85rem' }}>No activity yet</p>
              </div>
            ) : recentScans.map((scan, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '10px',
                background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border)',
                transition: 'border-color 0.2s',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px',
                  background: scan.type === 'checkin' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${scan.type === 'checkin' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <User size={16} style={{ color: scan.type === 'checkin' ? 'var(--success)' : 'var(--danger)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scan.visitor?.name || 'Unknown'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 0 }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {new Date(scan.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`badge ${scan.type === 'checkin' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                  {scan.type === 'checkin' ? 'IN' : 'OUT'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Instructions ── */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>How it works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { n: '01', title: 'Show QR Code', desc: 'Ask visitor to display their emailed QR pass' },
            { n: '02', title: 'Scan',         desc: 'Position code within the camera frame' },
            { n: '03', title: 'Auto-detect',  desc: 'System detects check-in vs check-out' },
            { n: '04', title: 'Logged',       desc: 'Entry is timestamped and recorded' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'rgba(99,102,241,0.4)', fontFamily: 'monospace', flexShrink: 0 }}>{s.n}</span>
              <div>
                <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.2rem' }}>{s.title}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
