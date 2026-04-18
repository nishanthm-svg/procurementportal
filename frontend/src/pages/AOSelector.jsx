import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function AOSelector() {
  const navigate = useNavigate()
  const [aos, setAos] = useState([])
  const [clusters, setClusters] = useState([])
  const [summary, setSummary] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [clusterFilter, setClusterFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.ao(), api.enums(), api.summary()]).then(([aoData, enums, s]) => {
      setAos(aoData.filter(r => r.ao && !r.ao.toLowerCase().includes('grand')).sort((a, b) => a.ao.localeCompare(b.ao)))
      setClusters(enums.clusters)
      setSummary(s)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = aos.filter(r => {
    if (clusterFilter && r.cluster_manager !== clusterFilter) return false
    if (search && !r.ao?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleView() {
    if (selected) navigate(`/ao/${encodeURIComponent(selected)}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ fontSize: 52, marginBottom: 12 }}>🥛</div>
        <h1 style={{ color: '#0c4a6e', fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5 }}>
          Procurement Portal
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>SMMPCL · Mar 2026</p>
        <p style={{ color: '#0ea5e9', fontSize: 12, fontWeight: 600, marginBottom: 24 }}>
          {loading ? 'Loading…' : `${aos.length} Area Offices · ${summary?.total_bmcu || 0} BMCUs · ${summary?.total_mpp?.toLocaleString('en-IN') || 0} MPPs`}
        </p>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #bae6fd',
          borderRadius: 16,
          padding: 24,
          textAlign: 'left',
          boxShadow: '0 4px 24px rgba(14,165,233,0.08)',
        }}>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>
            Select your Area Office to view dashboard
          </p>

          {/* Cluster filter pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <button
              onClick={() => setClusterFilter('')}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: !clusterFilter ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                background: !clusterFilter ? 'rgba(14,165,233,0.1)' : '#f8fafc',
                color: !clusterFilter ? '#0284c7' : '#64748b',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>All</button>
            {clusters.filter(c => c !== 'Grand Total').map(c => (
              <button key={c} onClick={() => setClusterFilter(c === clusterFilter ? '' : c)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: clusterFilter === c ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                  background: clusterFilter === c ? 'rgba(14,165,233,0.1)' : '#f8fafc',
                  color: clusterFilter === c ? '#0284c7' : '#64748b',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                {c.split(' ').slice(-2).join(' ')}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search AO name…"
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12,
              background: '#f8fafc', border: '1px solid #bae6fd', color: '#1e293b',
              outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.15)' }}
            onBlur={e => { e.target.style.borderColor = '#bae6fd'; e.target.style.boxShadow = 'none' }}
          />

          {/* AO List */}
          <div style={{
            maxHeight: 280, overflowY: 'auto', marginBottom: 16,
            border: '1px solid #e0f2fe', borderRadius: 10, background: '#fff',
          }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No AOs found</div>
            ) : filtered.map(r => (
              <div key={r.ao}
                onClick={() => setSelected(selected === r.ao ? null : r.ao)}
                style={{
                  padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  borderBottom: '1px solid #f0f9ff',
                  background: selected === r.ao ? 'rgba(14,165,233,0.08)' : 'transparent',
                  color: selected === r.ao ? '#0284c7' : '#1e293b',
                  borderLeft: selected === r.ao ? '3px solid #0ea5e9' : '3px solid transparent',
                  transition: 'all 0.12s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <span>{r.ao}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>
                  {r.cluster_manager?.split(' ').slice(-2).join(' ')}
                </span>
              </div>
            ))}
          </div>

          {/* View Button */}
          <button
            onClick={handleView}
            disabled={!selected}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: 'none', cursor: selected ? 'pointer' : 'not-allowed',
              background: selected
                ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                : '#f1f5f9',
              color: selected ? '#fff' : '#94a3b8',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: selected ? '0 4px 12px rgba(14,165,233,0.35)' : 'none',
            }}>
            {selected ? `📊 View Dashboard — ${selected}` : 'Select an AO to continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
