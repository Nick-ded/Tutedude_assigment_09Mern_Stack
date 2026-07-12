// SecurityScan.jsx
// QR scanner page for security staff
// uses html5-qrcode library

import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { CheckCircle2, XCircle, Clock, User, RefreshCw } from 'lucide-react'
import api from '../api'

export default function SecurityScan() {
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false) // prevent duplicate scans
  const [recentLogs, setRecentLogs] = useState([])
  const scannerRef = useRef(null)

  useEffect(() => {
    loadRecentLogs()
    startCamera()

    // cleanup when leaving page
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [])

  function startCamera() {
    // slight delay so the div is rendered first
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      }, false)

      scanner.render(onScanSuccess, onScanError)
      scannerRef.current = scanner
    }, 200)
  }

  async function onScanSuccess(qrText) {
    // debounce - ignore if already processing
    if (scanning) return
    setScanning(true)
    setScanResult(null)

    console.log('scanned:', qrText)

    try {
      const { data } = await api.post('/checklogs/scan', { qrCodeData: qrText })
      setScanResult({ ok: true, ...data })
      loadRecentLogs()
    } catch (err) {
      console.log('scan error:', err.response?.data)
      setScanResult({
        ok: false,
        message: err.response?.data?.message || 'Invalid QR code',
      })
    } finally {
      // allow next scan after 3 seconds
      setTimeout(() => setScanning(false), 3000)
    }
  }

  function onScanError(err) {
    // html5-qrcode fires this constantly while searching, ignore it
    // console.log('scan attempt:', err)
  }

  async function loadRecentLogs() {
    try {
      const { data } = await api.get('/checklogs/recent')
      setRecentLogs(data)
    } catch (err) {
      console.log('could not load recent logs:', err.message)
    }
  }

  function clearResult() {
    setScanResult(null)
    setScanning(false)
  }

  return (
    <div className="container animate-fade-up" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

      {/* header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.25rem' }}>Security Scanner</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Scan visitor QR passes — system auto-detects check-in or check-out
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

        {/* camera + result */}
        <div className="glass-panel">

          {/* camera view */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.15)', background: '#000', marginBottom: '1.25rem' }}>
            <div id="reader" style={{ width: '100%' }} />
          </div>

          {/* scan result */}
          <div style={{ minHeight: 80 }}>
            {scanning && !scanResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Clock size={22} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ color: '#fbbf24' }}>Verifying pass...</span>
              </div>
            )}

            {scanResult && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.9rem', padding: '1.1rem', borderRadius: 10,
                background: scanResult.ok ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${scanResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                animation: 'fadeUp 0.3s ease',
              }}>
                {scanResult.ok
                  ? <CheckCircle2 size={28} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                  : <XCircle     size={28} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                }
                <div style={{ flex: 1 }}>
                  {scanResult.ok ? (
                    <>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#10b981', marginBottom: '0.2rem' }}>
                        {scanResult.type === 'checkin' ? '✅ Checked In' : '🔚 Checked Out'}
                      </p>
                      {scanResult.visitorName && (
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.15rem' }}>
                          <strong>Visitor:</strong> {scanResult.visitorName}
                        </p>
                      )}
                      <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{scanResult.message}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.2rem' }}>Access Denied</p>
                      <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{scanResult.message}</p>
                    </>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ padding: '0.25rem', flexShrink: 0 }} onClick={clearResult}>
                  <RefreshCw size={15} />
                </button>
              </div>
            )}

            {!scanning && !scanResult && (
              <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.85rem', padding: '1rem' }}>
                Point camera at a QR pass to scan
              </p>
            )}
          </div>
        </div>

        {/* recent activity sidebar */}
        <div className="glass-panel" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Activity</h3>
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={loadRecentLogs}>
              <RefreshCw size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: 480, overflowY: 'auto' }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: '#334155', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>
                No activity yet
              </p>
            ) : recentLogs.map((log, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.65rem 0.8rem', borderRadius: 8,
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid rgba(99,102,241,0.1)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: log.type === 'checkin' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${log.type === 'checkin' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                  <User size={14} style={{ color: log.type === 'checkin' ? '#10b981' : '#ef4444' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.visitor?.name || 'Unknown'}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#475569' }}>
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`badge ${log.type === 'checkin' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.62rem' }}>
                  {log.type === 'checkin' ? 'IN' : 'OUT'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* instructions */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.9rem' }}>Instructions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.9rem' }}>
          {[
            { n: '1', t: 'Ask visitor to show QR', d: 'They receive it by email after approval' },
            { n: '2', t: 'Scan the code',          d: 'Hold QR within the camera frame' },
            { n: '3', t: 'Auto detection',          d: 'System figures out check-in or out' },
            { n: '4', t: 'Entry logged',             d: 'Timestamp saved to audit trail' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '0.65rem' }}>
              <span style={{ fontWeight: 800, color: 'rgba(99,102,241,0.4)', fontFamily: 'monospace', fontSize: '1rem', flexShrink: 0 }}>{s.n}.</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.18rem' }}>{s.t}</p>
                <p style={{ color: '#475569', fontSize: '0.76rem' }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
