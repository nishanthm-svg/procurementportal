import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import shreejaLogo from '../assets/shreeja-logo.png'

const FALLBACK_MONTHS = [
  'Apr25', 'May25', 'Jun25', 'Jul25', 'Aug25', 'Sep25', 'Oct25', 'Nov25', 'Dec25', 'Jan26', 'Feb26', 'Mar26',
  'Apr26', 'May26', 'Jun26', 'Jul26', 'Aug26', 'Sep26', 'Oct26', 'Nov26', 'Dec26', 'Jan27', 'Feb27', 'Mar27',
]

function monthLabel(key) {
  return `${key.slice(0, 3)}'${key.slice(3)}`
}

export default function AdminPortal() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [status, setStatus] = useState(null)
  const [months, setMonths] = useState(FALLBACK_MONTHS)
  const [monthKey, setMonthKey] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!token) return
    api.adminStatus(token).then(s => {
      setStatus(s)
      setMonths(s.months?.length ? s.months : FALLBACK_MONTHS)
      setMonthKey(prev => prev || (s.months || FALLBACK_MONTHS).at(-1))
    }).catch(() => {
      sessionStorage.removeItem('admin_token')
      setToken('')
    })
  }, [token])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)
    try {
      const { token: t } = await api.adminLogin(password)
      sessionStorage.setItem('admin_token', t)
      setToken(t)
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_token')
    setToken('')
    setStatus(null)
    setResult(null)
  }

  function readFileAsBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(f)
    })
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !monthKey) return
    setUploading(true)
    setUploadError('')
    setResult(null)
    try {
      const fileBase64 = await readFileAsBase64(file)
      const res = await api.adminUpload(token, { fileBase64, monthKey, monthLabel: monthLabel(monthKey) })
      setResult(res)
      setStatus(s => ({ ...s, month: res.summary?.month, recordCounts: res.recordCounts, lastUpdated: new Date().toISOString() }))
      setFile(null)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const shell = (children) => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={shreejaLogo} alt="Shreeja" style={{ height: 40, margin: '0 auto 10px', display: 'block' }} />
          <h1 style={{ color: '#0c4a6e', fontSize: 20, fontWeight: 800, margin: 0 }}>Admin — Monthly Data</h1>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Upload the monthly Procurement Performance workbook</p>
        </div>
        {children}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 12, color: '#0ea5e9', textDecoration: 'none' }}>← Back to portal</Link>
        </div>
      </div>
    </div>
  )

  if (!token) {
    return shell(
      <form onSubmit={handleLogin} style={{
        background: '#fff', border: '1px solid #bae6fd', borderRadius: 16, padding: 24,
        boxShadow: '0 4px 24px rgba(14,165,233,0.08)',
      }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Admin password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginTop: 6, marginBottom: 12,
            background: '#f8fafc', border: '1px solid #bae6fd', color: '#1e293b', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {loginError && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{loginError}</p>}
        <button type="submit" disabled={loggingIn || !password} style={{
          width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none',
          cursor: loggingIn || !password ? 'not-allowed' : 'pointer',
          background: loggingIn || !password ? '#f1f5f9' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          color: loggingIn || !password ? '#94a3b8' : '#fff',
        }}>
          {loggingIn ? 'Checking…' : 'Log in'}
        </button>
      </form>
    )
  }

  return shell(
    <div>
      <div style={{
        background: '#fff', border: '1px solid #bae6fd', borderRadius: 16, padding: 20,
        boxShadow: '0 4px 24px rgba(14,165,233,0.08)', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0c4a6e' }}>Current data</span>
          <button onClick={handleLogout} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
        </div>
        {status ? (
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
            <div>Month loaded: <strong>{status.month || '—'}</strong></div>
            <div>Last updated: <strong>{status.lastUpdated ? new Date(status.lastUpdated).toLocaleString('en-IN') : '—'}</strong></div>
            <div>AOs: <strong>{status.recordCounts?.ao ?? '—'}</strong> · BMCUs: <strong>{status.recordCounts?.bmcu ?? '—'}</strong> · MPPs: <strong>{status.recordCounts?.mpp ?? '—'}</strong></div>
          </div>
        ) : <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading…</div>}
      </div>

      <form onSubmit={handleUpload} style={{
        background: '#fff', border: '1px solid #bae6fd', borderRadius: 16, padding: 20,
        boxShadow: '0 4px 24px rgba(14,165,233,0.08)',
      }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Reporting month (used for Budget vs Actual)
        </label>
        <select value={monthKey} onChange={e => setMonthKey(e.target.value)} style={{
          width: '100%', padding: '9px 10px', borderRadius: 8, fontSize: 13, marginBottom: 14,
          background: '#f8fafc', border: '1px solid #bae6fd', color: '#1e293b', outline: 'none', boxSizing: 'border-box',
        }}>
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>

        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Excel workbook (.xlsx)
        </label>
        <input
          type="file"
          accept=".xlsx"
          onChange={e => { setFile(e.target.files[0] || null); setResult(null); setUploadError('') }}
          style={{ width: '100%', fontSize: 12, marginBottom: 14 }}
        />

        {uploadError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, padding: 10, borderRadius: 8, marginBottom: 12 }}>
            {uploadError}
          </div>
        )}

        {result && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12, padding: 10, borderRadius: 8, marginBottom: 12 }}>
            ✓ Rebuilt for {result.summary?.month}: {result.recordCounts?.ao} AOs, {result.recordCounts?.bmcu} BMCUs, {result.recordCounts?.mpp} MPPs.
          </div>
        )}

        <button type="submit" disabled={uploading || !file} style={{
          width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none',
          cursor: uploading || !file ? 'not-allowed' : 'pointer',
          background: uploading || !file ? '#f1f5f9' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          color: uploading || !file ? '#94a3b8' : '#fff',
        }}>
          {uploading ? 'Processing… this can take a moment' : 'Upload & rebuild dashboard'}
        </button>
      </form>
    </div>
  )
}
