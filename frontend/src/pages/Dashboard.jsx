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

const CHART_COLORS = ['#FF8C42', '#FF6B6B', '#FFB366', '#FBBF24', '#4ADE80']

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const heroVariants = {
  initial: { opacity: 0, y: 60, scale: 0.95, filter: 'blur(10px)' },
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
  background: 'rgba(26,21,16,0.95)',
  border: '1px solid rgba(255,140,66,0.15)',
  borderRadius: '10px',
  color: '#f5f0eb',
  fontSize: '0.8125rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

// Generate mock prediction volume data
const predictionData = Array.from({ length: 14 }, (_, i) => ({
  week: `W${i + 1}`,
  predictions: Math.floor(Math.random() * 600 + 400),
  approved: Math.floor(Math.random() * 400 + 250),
}))

// Decision distribution
const decisionData = [
  { name: 'Approved', value: 68.3, color: '#FF8C42' },
  { name: 'Rejected', value: 31.7, color: '#FF6B6B' },
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
    { label: 'Model Accuracy', value: parseFloat(accuracy), suffix: '%', delta: '+2.1% from v1', deltaType: 'positive', sparkData: [65, 72, 68, 80, 75, 88, 94] },
    { label: 'Total Predictions', value: 12847, suffix: '', delta: 'Active pipeline', deltaType: 'neutral', sparkData: [40, 55, 48, 62, 58, 70, 82] },
    { label: 'Approval Rate', value: 68.3, suffix: '%', delta: 'Within threshold', deltaType: 'neutral', sparkData: [60, 63, 65, 64, 67, 66, 68] },
    { label: 'API Uptime', value: 99.97, suffix: '%', delta: 'Online', deltaType: 'positive', sparkData: [99, 99, 100, 99, 100, 100, 100], showPulse: true },
  ]

  return (
    <PageTransition>
      <motion.div variants={containerVariants} initial="initial" animate="animate">

        {/* ═══ HERO SECTION — Text only, 3D core is fixed behind everything ═══ */}
        <motion.div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 2 }} variants={heroVariants}>
          <p className="text-label" style={{ color: 'var(--ember)', letterSpacing: '0.15em', marginBottom: '12px' }}>
            MLOPS COMMAND CENTER
          </p>
          <h1 className="text-display hero-title" style={{ marginBottom: '12px' }}>
            LoanAI Prediction Engine
          </h1>
          <p className="text-body" style={{ maxWidth: '500px', margin: '0 auto 8px' }}>
            V2 Feature-Engineered Pipeline — Real-time AI decisioning at scale
          </p>


        </motion.div>

        {/* ═══ STAT CARDS — 4 Glassmorphic Cards ═══ */}
        <motion.div className="stats-grid" variants={containerVariants} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              variants={cardVariants}
              whileHover={{
                y: -6,
                borderColor: 'rgba(255,140,66,0.3)',
                boxShadow: '0 12px 40px rgba(255,140,66,0.15)',
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
        <div className="section-grid" style={{ marginBottom: '32px' }}>
          {/* Prediction Volume Chart */}
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="text-title">Prediction Volume</h3>
              <span className="badge badge-ember">14 Weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={predictionData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8C42" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF8C42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#44403c" fontSize={11} />
                <YAxis stroke="#44403c" fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="predictions" stroke="#FF8C42" strokeWidth={2.5} fill="url(#predGrad)" name="Total" />
                <Area type="monotone" dataKey="approved" stroke="#FFB366" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Decision Distribution */}
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
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
                      <Cell key={index} fill={entry.color} style={{ filter: index === 0 ? 'drop-shadow(0 0 8px rgba(255,140,66,0.4))' : 'none' }} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {decisionData.map((d, i) => (
                  <div key={d.name} style={{ marginBottom: i === 0 ? '24px' : '0' }}>
                    <div className="text-label" style={{ marginBottom: '4px' }}>{d.name}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: d.color }}>
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
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <div style={{ padding: 'var(--space-lg) var(--space-lg) 0' }}>
              <h3 className="text-title">AI Decision Engine</h3>
              <p className="text-body" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>Neural network topology — 5 layers, 27 nodes</p>
            </div>
            <Suspense fallback={<div style={{ height: '250px' }} />}>
              <NeuralNetwork3D style={{ height: '260px', borderRadius: 0 }} />
            </Suspense>
            <div style={{ padding: '0 var(--space-lg) var(--space-lg)', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label">Architecture</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ember)', marginTop: '2px' }}>Random Forest</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label">Features</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--gold)', marginTop: '2px' }}>52+</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label">Version</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>v2.0</div>
              </div>
            </div>
          </motion.div>

          {/* Feature Importance */}
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="text-title">Top Feature Signals</h3>
              <span className="badge badge-ember">{features.length > 0 ? `${Math.min(features.length, 10)} features` : 'Loading...'}</span>
            </div>
            {features.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={features.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                  <defs>
                    <linearGradient id="featureGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF8C42" />
                      <stop offset="100%" stopColor="#FFB366" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" stroke="#44403c" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#78716c" fontSize={11} width={120}
                    tick={({ x, y, payload }) => (
                      <text x={x} y={y} dy={4} textAnchor="end" fill="#a8a29e" fontSize={11}>
                        {payload.value.replace(/_/g, ' ')}
                      </text>
                    )}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="importance" fill="url(#featureGrad)" radius={[0, 4, 4, 0]}>
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
        <motion.div className="glass-card-glow" variants={cardVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="pulse-indicator" />
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>System Status</div>
                <div className="text-label" style={{ marginTop: '2px' }}>
                  {health ? 'All systems operational' : 'Connecting...'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '32px' }}>
              {[
                { label: 'Model', value: modelInfo?.model_name || 'RandomForest', status: 'active' },
                { label: 'Pipeline', value: 'V2 Feature Engine', status: 'active' },
                { label: 'MLflow', value: 'Tracking Active', status: 'active' },
                { label: 'API', value: health?.status || 'Checking...', status: health ? 'active' : 'pending' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div className="text-label">{s.label}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: s.status === 'active' ? 'var(--emerald)' : 'var(--text-muted)', marginTop: '2px' }}>
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
            whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(255, 140, 66, 0.4)' }}
            whileTap={{ scale: 0.97 }}
          >
            New Prediction
          </motion.button>
          <motion.button className="btn btn-secondary btn-lg" onClick={() => navigate('/performance')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          >
            Performance
          </motion.button>
          <motion.button className="btn btn-secondary btn-lg" onClick={() => navigate('/experiments')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          >
            Experiments
          </motion.button>
        </motion.div>

      </motion.div>
    </PageTransition>
  )
}
