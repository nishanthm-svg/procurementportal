import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const API = import.meta.env.VITE_API_URL || ''

const CATEGORIES = {
  milk_quality:   { label: 'Milk Quality',       icon: '🥛', color: '#ef4444' },
  payment:        { label: 'Payment Issues',     icon: '💰', color: '#f97316' },
  equipment:      { label: 'Equipment Fault',    icon: '⚙️', color: '#eab308' },
  transport:      { label: 'Transport Issues',   icon: '🚛', color: '#3b82f6' },
  staff_behavior: { label: 'Staff Behavior',     icon: '👤', color: '#8b5cf6' },
  veterinary:     { label: 'Veterinary',         icon: '🐄', color: '#22c55e' },
  membership:     { label: 'Membership',         icon: '📋', color: '#6366f1' },
  other:          { label: 'Other',              icon: '📝', color: '#6b7280' },
}

const STATUS_META = {
  open:        { label: 'Open',        color: 'bg-red-100 text-red-800',     dot: 'bg-red-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className={`rounded-2xl p-4 border ${color} flex items-start gap-3`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-sm font-semibold opacity-80">{label}</div>
        {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.open
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function QRModal({ onClose }) {
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/grievance/qr`)
      .then(r => setQr(r.data))
      .catch(() => setQr({ url: `${window.location.origin}/complaint`, qrDataUrl: null }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">📱 Farmer QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">Generating QR code...</div>
        ) : (
          <div className="text-center space-y-4">
            {qr?.qrDataUrl ? (
              <img src={qr.qrDataUrl} alt="QR Code" className="mx-auto border rounded-xl" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="bg-gray-100 rounded-xl p-6 text-gray-500 text-sm">
                QR code will appear here after deploying with npm install (qrcode package)
              </div>
            )}
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">Complaint Form URL</div>
              <div className="font-mono text-sm text-green-800 break-all">{qr?.url}</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(qr?.url || ''); alert('URL copied!') }}
              className="w-full py-2.5 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800">
              📋 Copy URL
            </button>
            <p className="text-xs text-gray-400">Print this QR code and display at all MPP / BMCU centres</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ComplaintRow({ c, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(c.status)
  const [notes, setNotes] = useState(c.notes || '')
  const [saving, setSaving] = useState(false)
  const cat = CATEGORIES[c.category] || CATEGORIES.other
  const ageHours = Math.round((Date.now() - new Date(c.submittedAt)) / 36000) / 100

  async function save() {
    setSaving(true)
    try {
      await axios.patch(`${API}/api/grievance/complaints/${c.id}`, { status, notes })
      onStatusChange()
    } finally { setSaving(false) }
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${c.isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        {c.isOverdue && <span className="text-red-500 text-lg flex-shrink-0" title="Overdue">🚨</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-gray-900">{c.id}</span>
            <Badge status={c.status} />
            {c.isOverdue && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">OVERDUE</span>}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {cat.icon} {cat.label} &nbsp;·&nbsp; {c.farmerName} &nbsp;·&nbsp; {c.villageName}
            &nbsp;·&nbsp; {ageHours}h ago
          </div>
        </div>
        <div className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-white">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Farmer" value={c.farmerName} />
            <Info label="Village" value={c.villageName} />
            {c.mppCode  && <Info label="MPP Code"  value={c.mppCode} />}
            {c.bmcuCode && <Info label="BMCU Code" value={c.bmcuCode} />}
            {c.bmcuName && <Info label="BMCU Name" value={c.bmcuName} />}
            <Info label="Dept" value={c.department} />
            <Info label="Submitted" value={new Date(c.submittedAt).toLocaleString('en-IN')} />
            {c.resolvedAt && <Info label="Resolved" value={`${c.resolutionHours}h`} />}
          </div>

          {/* Transcription */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Grievance</div>
            <p className="text-sm text-gray-800">{c.transcription || <em className="opacity-50">No description provided</em>}</p>
          </div>

          {/* Admin update */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Update Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Admin Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add resolution notes..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2 rounded-lg bg-green-700 text-white font-semibold text-sm hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Update'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase font-bold">{label}</div>
      <div className="text-sm text-gray-800 font-medium">{value}</div>
    </div>
  )
}

export default function GrievanceDashboard() {
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [filter, setFilter] = useState({ status: '', category: '' })
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filter.status)   params.status   = filter.status
    if (filter.category) params.category = filter.category
    Promise.all([
      axios.get(`${API}/api/grievance/stats`),
      axios.get(`${API}/api/grievance/complaints`, { params }),
    ]).then(([s, c]) => {
      setStats(s.data)
      setComplaints(c.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(fetchAll, 60000)
    return () => clearInterval(id)
  }, [fetchAll])

  const catChartData = stats
    ? Object.entries(stats.byCat).map(([k, v]) => ({
        name: CATEGORIES[k]?.label || k,
        value: v,
        fill: CATEGORIES[k]?.color || '#6b7280',
      }))
    : []

  const resolutionData = stats
    ? Object.entries(STATUS_META)
        .map(([k, m]) => ({ name: m.label, value: stats.byStatus?.[k] || 0 }))
        .filter(d => d.value > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grievance Management</h1>
          <p className="text-sm text-gray-500">Shreeja MMPCL — Farmer Complaint Portal</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 font-medium"
          >
            ↺ Refresh
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 shadow"
          >
            📱 View QR Code
          </button>
        </div>
      </div>

      {/* Overdue alert banner */}
      {stats?.overdue > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-5 py-4 flex items-center gap-4">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="font-bold text-red-800 text-base">
              {stats.overdue} complaint{stats.overdue > 1 ? 's' : ''} OVERDUE (>{stats.slaHours}h)
            </div>
            <div className="text-red-600 text-sm">Immediate action required — scroll down to view overdue complaints</div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total"       value={stats.total}          icon="📊" color="border-slate-200 bg-slate-50 text-slate-800" />
          <StatCard label="Open"        value={stats.open}           icon="🔴" color="border-red-200 bg-red-50 text-red-800" />
          <StatCard label="In Progress" value={stats.inProgress}     icon="🟡" color="border-yellow-200 bg-yellow-50 text-yellow-800" />
          <StatCard label="Resolved"    value={stats.resolved}       icon="🟢" color="border-green-200 bg-green-50 text-green-800" />
          <StatCard label="Avg Resolution" value={`${stats.avgResolutionHours}h`}
            sub={`SLA: ${stats.slaHours}h`} icon="⏱️" color="border-blue-200 bg-blue-50 text-blue-800"
            className="col-span-2 lg:col-span-1" />
        </div>
      )}

      {/* Charts */}
      {catChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catChartData} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {catChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">By Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resolutionData} barCategoryGap="40%">
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Complaints" radius={[6, 6, 0, 0]}>
                  {resolutionData.map((_, i) => (
                    <Cell key={i} fill={['#ef4444', '#eab308', '#22c55e', '#6b7280'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters + table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="font-bold text-gray-700">All Complaints</h3>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
            <select
              value={filter.category}
              onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
              className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.icon} {c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-4xl">📭</div>
              <div className="text-gray-500 font-medium">No complaints found</div>
              <div className="text-gray-400 text-sm">Farmers can submit via the QR code</div>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <ComplaintRow key={c.id} c={c} onStatusChange={fetchAll} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}
    </div>
  )
}
