import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import { api } from './api'

function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api.summary().then(setSummary).catch(() => {})
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
