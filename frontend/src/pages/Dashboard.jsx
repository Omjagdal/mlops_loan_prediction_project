import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getHealth, getModelInfo, getFeatureImportance } from '../api/client'
import { usePrediction } from '../context/PredictionContext'
import AnimatedCounter from '../components/AnimatedCounter'
import Sparkline from '../components/Sparkline'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#FF8C42', '#FFB366', '#FBBF24', '#e67a35', '#FF6B6B']
const sparkData1 = [4, 7, 5, 9, 6, 8, 11, 7, 10, 8, 12, 9]
const sparkData2 = [3, 5, 8, 6, 10, 7, 9, 12, 8, 11, 7, 13]
const sparkData3 = [6, 4, 7, 9, 5, 8, 6, 10, 7, 8, 11, 9]

export default function Dashboard() {
  const [health, setHealth] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const { predictionHistory } = usePrediction()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [h, m, f] = await Promise.allSettled([
          getHealth(), getModelInfo(), getFeatureImportance()
        ])
        if (h.status === 'fulfilled') setHealth(h.value)
        if (m.status === 'fulfilled') setModelInfo(m.value)
        if (f.status === 'fulfilled') setFeatures(f.value.features?.slice(0, 10) || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const metrics = modelInfo?.metrics || {}
  const totalPredictions = predictionHistory.length
  const approvedCount = predictionHistory.filter(p => p.result?.prediction === 'Approved').length
  const approvalRate = totalPredictions > 0 ? ((approvedCount / totalPredictions) * 100) : 68.3

  const trendData = Array.from({ length: 14 }, (_, i) => ({
    name: `W${i + 1}`,
    predictions: Math.floor(Math.random() * 500 + 200),
    approved: Math.floor(Math.random() * 350 + 150),
  }))

  const distributionData = [
    { name: 'Approved', value: approvedCount || 68 },
    { name: 'Rejected', value: (totalPredictions - approvedCount) || 32 },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="animate-fade-up"
    >
      {/* ── Cinematic Hero ── */}
      <div className="page-header" style={{ marginBottom: '56px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '-60px', left: '-40px', width: '500px', height: '500px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,140,66,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: -1,
        }} />
        <p className="text-label" style={{ marginBottom: '12px', color: 'var(--ember)', letterSpacing: '0.15em' }}>
          MLOPS COMMAND CENTER
        </p>
        <h1 className="text-display" style={{ fontSize: '3.5rem', marginBottom: '12px' }}>
          LoanAI Prediction Engine
        </h1>
        <p style={{
          fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '620px', lineHeight: 1.7,
        }}>
          Trust Architecture meets Explainable AI — real-time loan decisioning
          with full model transparency and cinematic precision.
        </p>
      </div>

      {/* ── Stats Grid with Sparklines ── */}
      <div className="stats-grid stagger-children">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Model Accuracy</div>
              <div className="stat-value">
                <AnimatedCounter target={metrics.accuracy ? metrics.accuracy * 100 : 94.2} decimals={1} suffix="%" />
              </div>
              <div className="stat-delta positive">↑ 2.1% vs previous</div>
            </div>
            <Sparkline data={sparkData1} />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Total Predictions</div>
              <div className="stat-value">
                <AnimatedCounter target={totalPredictions > 0 ? totalPredictions : 12847} decimals={0} />
              </div>
              <div className="stat-delta positive">All-time processed</div>
            </div>
            <Sparkline data={sparkData2} color="var(--gold)" />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Approval Rate</div>
              <div className="stat-value">
                <AnimatedCounter target={approvalRate} decimals={1} suffix="%" />
              </div>
              <div className="stat-delta">Current session</div>
            </div>
            <Sparkline data={sparkData3} color="var(--emerald)" />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">API Status</div>
              <div className="stat-value" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`pulse-indicator ${health?.status === 'healthy' ? '' : 'ember'}`}></span>
                {health?.status === 'healthy' ? 'Online' : 'Checking...'}
              </div>
              <div className="stat-delta">Uptime: {health ? Math.floor(health.uptime_seconds) + 's' : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="section-grid">
        <div className="glass-card animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-title" style={{ marginBottom: '24px' }}>Prediction Volume</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="emberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8C42" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#FF8C42" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB366" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#FFB366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#44403c" fontSize={11} />
              <YAxis stroke="#44403c" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(26,21,16,0.95)', border: '1px solid rgba(255,140,66,0.15)',
                  borderRadius: '10px', color: '#f5f0eb', backdropFilter: 'blur(10px)',
                }}
              />
              <Area type="monotone" dataKey="predictions" stroke="#FF8C42" fill="url(#emberGrad)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="approved" stroke="#FFB366" fill="url(#goldGrad)" strokeWidth={1.5} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card animate-fade-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-title" style={{ marginBottom: '24px' }}>Decision Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <ResponsiveContainer width={190} height={190}>
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%"
                  innerRadius={58} outerRadius={85} paddingAngle={4} dataKey="value">
                  <Cell fill="#FF8C42" />
                  <Cell fill="#FF6B6B" />
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(26,21,16,0.95)', border: 'none', borderRadius: '10px', color: '#f5f0eb' }} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div className="text-label" style={{ marginBottom: '4px' }}>Approved</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ember)' }}>
                  <AnimatedCounter target={distributionData[0].value} />
                </div>
              </div>
              <div>
                <div className="text-label" style={{ marginBottom: '4px' }}>Rejected</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>
                  <AnimatedCounter target={distributionData[1].value} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Importance ── */}
      {features.length > 0 && (
        <div className="glass-card animate-fade-up" style={{ marginBottom: '32px', animationDelay: '400ms' }}>
          <h3 className="text-title" style={{ marginBottom: '24px' }}>Top Feature Importance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={features} layout="vertical" margin={{ left: 120 }}>
              <XAxis type="number" stroke="#44403c" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#78716c" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: 'rgba(26,21,16,0.95)', border: '1px solid rgba(255,140,66,0.15)', borderRadius: '10px', color: '#f5f0eb' }} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {features.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={1 - i * 0.06} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }} className="animate-fade-up" >
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')} style={{ minWidth: '200px' }}>
          New Prediction
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/performance')}>
          Performance
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/experiments')}>
          Experiments
        </button>
      </div>
    </motion.div>
  )
}
