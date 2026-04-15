import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import TopNav from './components/TopNav'
import ParticleSystem from './components/ParticleSystem'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Result from './pages/Result'
import Performance from './pages/Performance'
import Experiments from './pages/Experiments'
import Monitoring from './pages/Monitoring'
import { PredictionProvider } from './context/PredictionContext'

function App() {
  const location = useLocation()

  return (
    <PredictionProvider>
      {/* Cinematic background layers */}
      <div className="cinematic-bg" />
      <ParticleSystem count={25} />

      <div className="app-layout">
        <TopNav />
        <main className="main-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/predict" element={<Predict />} />
              <Route path="/result" element={<Result />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </PredictionProvider>
  )
}

export default App
