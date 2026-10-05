import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import AOSelector from './pages/AOSelector'
import AODetailView from './pages/AODetailView'
import ClusterView from './pages/ClusterView'
import AOView from './pages/AOView'
import BMCUView from './pages/BMCUView'
import MPPView from './pages/MPPView'
import BudgetView from './pages/BudgetView'
import LFLView from './pages/LFLView'
import GPRSView from './pages/GPRSView'
import AlertsView from './pages/AlertsView'
import RecoveriesView from './pages/RecoveriesView'
import ManpowerView from './pages/ManpowerView'
import GrievanceDashboard from './pages/GrievanceDashboard'
import ComplaintForm from './pages/ComplaintForm'
import { api } from './api'

const API_BASE = import.meta.env.VITE_API_URL || ''

function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api.summary().then(setSummary).catch(() => {})
    // Poll grievance overdue count every 60s and merge into summary
    function fetchOverdue() {
      fetch(`${API_BASE}/api/grievance/stats`)
        .then(r => r.json())
        .then(s => setSummary(prev => ({ ...(prev || {}), grievance_overdue: s.overdue || 0 })))
        .catch(() => {})
    }
    fetchOverdue()
    const id = setInterval(fetchOverdue, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar summary={summary} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-56 p-4 sm:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* AO selector — full-page dark screen, no shell */}
      <Route path="/" element={<AOSelector />} />

      {/* AO detail — full-page, no shell (has its own layout) */}
      <Route path="/ao/:aoName" element={<AODetailView />} />

      {/* Farmer complaint form — public, no shell (accessed via QR code) */}
      <Route path="/complaint" element={<ComplaintForm />} />

      {/* Admin / data views — wrapped in shell */}
      <Route path="/cluster" element={<Shell><ClusterView /></Shell>} />
      <Route path="/ao-list" element={<Shell><AOView /></Shell>} />
      <Route path="/bmcu" element={<Shell><BMCUView /></Shell>} />
      <Route path="/mpp" element={<Shell><MPPView /></Shell>} />
      <Route path="/budget" element={<Shell><BudgetView /></Shell>} />
      <Route path="/lfl" element={<Shell><LFLView /></Shell>} />
      <Route path="/gprs" element={<Shell><GPRSView /></Shell>} />
      <Route path="/alerts/:type" element={<Shell><AlertsView /></Shell>} />
      <Route path="/recoveries" element={<Shell><RecoveriesView /></Shell>} />
      <Route path="/manpower" element={<Shell><ManpowerView /></Shell>} />
      <Route path="/grievance" element={<GrievanceDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
