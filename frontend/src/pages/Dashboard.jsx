import { useState, useEffect, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getModelInfo, getHealth, getFeatureImportance } from '../api/client'
import AnimatedCounter from '../components/AnimatedCounter'
import Sparkline from '../components/Sparkline'
import PageTransition, { itemVariants } from '../components/PageTransition'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

// Lazy-load 3D components for performance
const NeuralNetwork3D = lazy(() => import('../components/NeuralNetwork3D'))

const CHART_COLORS = ['#006d37', '#2ecc71', '#b5f1c0', '#98472a', '#ff9875']

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const heroVariants = {
  initial: { opacity: 0, y: 60, scale: 0.97, filter: 'blur(8px)' },
  animate: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
}

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.97 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

const chartTooltipStyle = {
  background: 'rgba(254,249,240,0.95)',
  backdropFilter: 'blur(12px)',
  border: 'none',
  borderRadius: '16px',
  color: '#1d1c16',
  fontSize: '0.8125rem',
  boxShadow: '0 8px 32px rgba(29,28,22,0.1)',
}

// Generate mock prediction volume data
const predictionData = Array.from({ length: 14 }, (_, i) => ({
  week: `W${i + 1}`,
  predictions: Math.floor(Math.random() * 600 + 400),
  approved: Math.floor(Math.random() * 400 + 250),
}))

// Decision distribution
const decisionData = [
  { name: 'Approved', value: 68.3, color: '#006d37' },
  { name: 'Rejected', value: 31.7, color: '#98472a' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [modelInfo, setModelInfo] = useState(null)
  const [health, setHealth] = useState(null)
  const [features, setFeatures] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, h, f] = await Promise.allSettled([getModelInfo(), getHealth(), getFeatureImportance()])
        if (m.status === 'fulfilled') setModelInfo(m.value)
        if (h.status === 'fulfilled') setHealth(h.value)
        if (f.status === 'fulfilled') setFeatures(f.value.features || [])
      } catch { }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])



  const metrics = modelInfo?.metrics || {}
  const accuracy = ((metrics.accuracy || 0.942) * 100).toFixed(1)

  const stats = [
    { label: 'Mode Accuracy', value: parseFloat(accuracy), suffix: '%', delta: '+2.1% from v1', deltaType: 'positive', sparkData: [65, 72, 68, 80, 75, 88, 94] },
    { label: 'Total Predictions', value: 12847, suffix: '', delta: 'Active pipeline', deltaType: 'neutral', sparkData: [40, 55, 48, 62, 58, 70, 82] },
    { label: 'Approval Rate', value: 68.3, suffix: '%', delta: 'Within threshold', deltaType: 'neutral', sparkData: [60, 63, 65, 64, 67, 66, 68] },
    { label: 'API Uptime', value: 99.97, suffix: '%', delta: 'Online', deltaType: 'positive', sparkData: [99, 99, 100, 99, 100, 100, 100], showPulse: true },
  ]

  return (
    <PageTransition>
      <motion.div variants={containerVariants} initial="initial" animate="animate">

        {/* ═══ HERO SECTION — Editorial organic ═══ */}
        <motion.div style={{ textAlign: 'center', marginBottom: '64px', position: 'relative', zIndex: 2 }} variants={heroVariants}>
          <p className="text-label" style={{ color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '16px' }}>
            INTELLIGENT LOAN PREDICTION
          </p>
          <h1 className="text-display hero-title" style={{ marginBottom: '16px' }}>
            LoanAI Prediction Engine
          </h1>
          <p className="text-body" style={{ maxWidth: '550px', margin: '0 auto 8px', fontSize: '1.0625rem' }}>
            Empowering financial decisions with machine learning precision.
            Real-time AI decisioning at scale.
          </p>
        </motion.div>

        {/* ═══ IMPACT POD STAT CARDS ═══ */}
        <motion.div className="stats-grid" variants={containerVariants} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              variants={cardVariants}
              whileHover={{
                y: -6,
                boxShadow: '0 16px 48px rgba(29,28,22,0.08)',
                transition: { duration: 0.3 },
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-label">{stat.label}</div>
                {stat.showPulse && <span className="pulse-indicator" />}
              </div>
              <div className="stat-value" style={{ margin: '8px 0 4px' }}>
                <AnimatedCounter target={stat.value} decimals={stat.suffix === '%' ? 1 : 0} suffix={stat.suffix} />
              </div>
              <div className={`stat-delta ${stat.deltaType}`}>{stat.delta}</div>
              <div style={{ marginTop: '12px' }}>
                <Sparkline data={stat.sparkData} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ CHARTS — 2 Column Grid ═══ */}
        <div className="section-grid" style={{ marginBottom: '48px' }}>
          {/* Prediction Volume Chart */}
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)', transition: { duration: 0.3 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="text-title">Prediction Volume</h3>
              <span className="badge badge-success">14 Weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={predictionData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2ecc71" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2ecc71" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#bbcbbb" fontSize={11} />
                <YAxis stroke="#bbcbbb" fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="predictions" stroke="#006d37" strokeWidth={2.5} fill="url(#predGrad)" name="Total" />
                <Area type="monotone" dataKey="approved" stroke="#4ae183" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Decision Distribution */}
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)', transition: { duration: 0.3 } }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Decision Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={decisionData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {decisionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {decisionData.map((d, i) => (
                  <div key={d.name} style={{ marginBottom: i === 0 ? '24px' : '0' }}>
                    <div className="text-label" style={{ marginBottom: '4px' }}>{d.name}</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: d.color }}>
                      <AnimatedCounter target={d.value} decimals={1} suffix="%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ 3D NEURAL NETWORK (decorative) + FEATURE IMPORTANCE ═══ */}
        <div className="section-grid" style={{ gridTemplateColumns: '1fr 1.5fr', alignItems: 'start' }}>
          {/* Neural Network Viz */}
          <motion.div className="glass-card" variants={cardVariants} style={{ padding: 0, overflow: 'hidden' }}
            whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)', transition: { duration: 0.3 } }}
          >
            <div style={{ padding: 'var(--space-2xl) var(--space-2xl) 0' }}>
              <h3 className="text-title">AI Decision Engine</h3>
              <p className="text-body" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>Neural network topology — 5 layers, 27 nodes</p>
            </div>
            <Suspense fallback={<div style={{ height: '250px' }} />}>
              <NeuralNetwork3D style={{ height: '260px', borderRadius: 0 }} />
            </Suspense>
            <div style={{ padding: '0 var(--space-2xl) var(--space-2xl)', display: 'flex', gap: '24px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label">Architecture</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--primary)', marginTop: '4px' }}>Random Forest</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label">Features</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--primary-container)', marginTop: '4px' }}>52+</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label">Version</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--on-surface)', marginTop: '4px' }}>v2.0</div>
              </div>
            </div>
          </motion.div>

          {/* Feature Importance */}
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)', transition: { duration: 0.3 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="text-title">Top Feature Signals</h3>
              <span className="badge badge-success">{features.length > 0 ? `${Math.min(features.length, 10)} features` : 'Loading...'}</span>
            </div>
            {features.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={features.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                  <defs>
                    <linearGradient id="featureGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#006d37" />
                      <stop offset="100%" stopColor="#2ecc71" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" stroke="#bbcbbb" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#6c7b6d" fontSize={11} width={120}
                    tick={({ x, y, payload }) => (
                      <text x={x} y={y} dy={4} textAnchor="end" fill="#3d4a3e" fontSize={11}>
                        {payload.value.replace(/_/g, ' ')}
                      </text>
                    )}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="importance" fill="url(#featureGrad)" radius={[0, 9999, 9999, 0]}>
                    {features.slice(0, 10).map((_, i) => (
                      <Cell key={i} fillOpacity={1 - i * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '2px', margin: '0 auto 12px' }} />
                  <p className="text-label">Loading feature data...</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ═══ SYSTEM STATUS BAR ═══ */}
        <motion.div className="glass-card-glow" variants={cardVariants} style={{ marginBottom: '48px', marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="pulse-indicator" />
              <div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '0.9375rem', fontWeight: 600 }}>System Status</div>
                <div className="text-label" style={{ marginTop: '2px' }}>
                  {health ? 'All systems operational' : 'Connecting...'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '40px' }}>
              {[
                { label: 'Model', value: modelInfo?.model_name || 'RandomForest', status: 'active' },
                { label: 'Pipeline', value: 'V2 Feature Engine', status: 'active' },
                { label: 'MLflow', value: 'Tracking Active', status: 'active' },
                { label: 'API', value: health?.status || 'Checking...', status: health ? 'active' : 'pending' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div className="text-label">{s.label}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: s.status === 'active' ? 'var(--primary)' : 'var(--text-muted)', marginTop: '4px' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }} variants={itemVariants}>
          <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')}
            whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(0, 109, 55, 0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            New Prediction
          </motion.button>
          <motion.button className="btn btn-secondary btn-lg" onClick={() => navigate('/performance')}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            Performance
          </motion.button>
          <motion.button className="btn btn-secondary btn-lg" onClick={() => navigate('/experiments')}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            Experiments
          </motion.button>
        </motion.div>

      </motion.div>
    </PageTransition>
  )
}
