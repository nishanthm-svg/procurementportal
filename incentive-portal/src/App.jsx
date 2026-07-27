import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import Lookup from './pages/Lookup'
import Meeting from './pages/Meeting'
import Leaderboard from './pages/Leaderboard'
import BMCUSummary from './pages/BMCUSummary'
import ACOSummary from './pages/ACOSummary'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16 sm:pb-0">
      <NavBar />
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <Routes>
          <Route path="/" element={<Lookup />} />
          <Route path="/meeting" element={<Meeting />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/bmcu-summary" element={<BMCUSummary />} />
          <Route path="/aco-summary" element={<ACOSummary />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
