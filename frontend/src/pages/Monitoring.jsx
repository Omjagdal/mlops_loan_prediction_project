import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getHealth } from '../api/client'
import AnimatedCounter from '../components/AnimatedCounter'
import PageTransition, { itemVariants } from '../components/PageTransition'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PipelineDiagram from '../components/PipelineDiagram'

const genTS = (n, base, v) => Array.from({ length: n }, (_, i) => ({ time: `${i}m`, value: Math.max(0, base + (Math.random() - 0.5) * v) }))

const pipelines = [
  { name: 'Data Pipeline', status: 'Active', icon: 'DB', color: 'var(--primary)' },
  { name: 'Model Training', status: 'Idle', icon: 'ML', color: 'var(--warning)' },
  { name: 'API Server', status: 'Running', icon: 'API', color: 'var(--primary)' },
  { name: 'Docker Engine', status: 'Healthy', icon: 'SYS', color: 'var(--primary)' },
]

const activityLog = [
  { time: '2 min ago', event: 'API prediction served', type: 'success' },
  { time: '5 min ago', event: 'Model health check passed', type: 'success' },
  { time: '15 min ago', event: 'Prometheus metrics scraped', type: 'info' },
  { time: '1 hour ago', event: 'Model v2.0 deployed to production', type: 'deploy' },
  { time: '2 hours ago', event: 'V2 training pipeline completed — F1: 93.8%', type: 'success' },
  { time: '3 hours ago', event: 'V2 feature engineering — 52 features generated', type: 'info' },
]

const pods = [
  { name: 'backend-7f8d9c-abc12', status: 'Running', cpu: '120m', mem: '256Mi', restarts: 0 },
  { name: 'backend-7f8d9c-def34', status: 'Running', cpu: '95m', mem: '232Mi', restarts: 0 },
  { name: 'mlflow-5c4a2b-jkl78', status: 'Running', cpu: '80m', mem: '512Mi', restarts: 0 },
  { name: 'prometheus-9d1e3f-mno90', status: 'Running', cpu: '45m', mem: '128Mi', restarts: 0 },
]

const Gauge = ({ label, value, color = 'var(--primary)' }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto' }}>
      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-container-highest)" strokeWidth="2.8" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="2.8"
          strokeDasharray={`${value} ${100 - value}`} strokeLinecap="round"
          style={{ transition: 'all 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 800, color }}><AnimatedCounter target={value} suffix="%" /></span>
      </div>
    </div>
    <div className="text-label" style={{ marginTop: '8px' }}>{label}</div>
  </div>
)

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function Monitoring() {
  const [health, setHealth] = useState(null)
  const [reqData] = useState(genTS(30, 45, 30))
  const [latData] = useState(genTS(30, 42, 20))
  const [errData] = useState(genTS(30, 0.5, 1.5))
  const cpuVal = Math.floor(Math.random() * 30 + 25)
  const memVal = Math.floor(Math.random() * 20 + 40)

  useEffect(() => {
    const fn = async () => { try { setHealth(await getHealth()) } catch {} }
    fn(); const i = setInterval(fn, 10000); return () => clearInterval(i)
  }, [])

  const chartStyle = {
    background: 'rgba(254,249,240,0.95)',
    backdropFilter: 'blur(12px)',
    border: 'none',
    borderRadius: '16px',
    color: '#1d1c16',
    fontSize: '0.75rem',
  }

  return (
    <PageTransition>
      <motion.div initial="initial" animate="animate" variants={{ initial: {}, animate: { transition: { staggerChildren: 0.1 } } }}>

        <motion.div className="page-header" variants={itemVariants}>
          <p className="text-label" style={{ color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '8px' }}>SYSTEM HEALTH</p>
          <h1>System Monitoring</h1>
          <p>Real-time infrastructure metrics, API performance, and deployment status.</p>
        </motion.div>

        {/* Pipeline Status Cards */}
        <motion.div className="stats-grid stagger-children" variants={{ initial: {}, animate: { transition: { staggerChildren: 0.08 } } }}>
          {pipelines.map(p => (
            <motion.div key={p.name} className="stat-card" variants={cardVariants}
              whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(29,28,22,0.08)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)' }}>{p.icon}</span>
                <span className={`pulse-indicator ${p.status === 'Idle' ? 'warning' : ''}`} />
              </div>
              <div style={{ marginTop: '12px', fontFamily: 'var(--font-headline)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--on-surface)' }}>{p.name}</div>
              <div style={{ fontSize: '0.8125rem', color: p.color, marginTop: '4px' }}>{p.status}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ ML PIPELINE DATA FLOW DIAGRAM ═══ */}
        <motion.div className="glass-card" variants={cardVariants} style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}
          whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)' }}
        >
          <div style={{ padding: 'var(--space-2xl) var(--space-2xl) 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="text-title">ML Pipeline Data Flow</h3>
                <p className="text-body" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>End-to-end pipeline: Ingestion → Feature Engineering → Training → Gates → Registry → Production</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-indicator" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>LIVE</span>
              </div>
            </div>
          </div>
          <PipelineDiagram />
        </motion.div>

        {/* Metrics Charts */}
        <div className="section-grid-3" style={{ marginBottom: '24px' }}>
          {[
            { title: 'Request Rate (req/min)', data: reqData, color: '#006d37', grad: 'reqG' },
            { title: 'Response Time (ms)', data: latData, color: '#2ecc71', grad: 'latG' },
            { title: 'Error Rate (%)', data: errData, color: '#ba1a1a', grad: 'errG' },
          ].map(c => (
            <motion.div key={c.title} className="glass-card" variants={cardVariants}
              whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)' }}
            >
              <h4 className="text-label" style={{ marginBottom: '16px' }}>{c.title}</h4>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={c.data}>
                  <defs><linearGradient id={c.grad} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.color} stopOpacity={0.2} /><stop offset="100%" stopColor={c.color} stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="time" stroke="#bbcbbb" fontSize={10} /><YAxis stroke="#bbcbbb" fontSize={10} />
                  <Tooltip contentStyle={chartStyle} />
                  <Area type="monotone" dataKey="value" stroke={c.color} fill={`url(#${c.grad})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ))}
        </div>

        {/* Infrastructure + Activity Log */}
        <div className="section-grid" style={{ alignItems: 'start' }}>
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)' }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Infrastructure</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '32px' }}>
              <Gauge label="CPU" value={cpuVal} color="var(--primary)" />
              <Gauge label="Memory" value={memVal} color="var(--primary-container)" />
              <Gauge label="Disk" value={32} color="var(--secondary)" />
            </div>
            <h4 className="text-label" style={{ marginBottom: '12px' }}>Kubernetes Pods</h4>
            <table className="data-table"><thead><tr><th>Pod</th><th>Status</th><th>CPU</th><th>Memory</th><th>Restarts</th></tr></thead>
              <tbody>{pods.map(p => (<tr key={p.name}><td><code style={{ color: 'var(--on-surface-variant)', fontSize: '0.7rem' }}>{p.name}</code></td>
                <td><span className="badge badge-success">{p.status}</span></td><td>{p.cpu}</td><td>{p.mem}</td><td>{p.restarts}</td></tr>))}</tbody></table>
          </motion.div>
          <motion.div className="glass-card" variants={cardVariants}
            whileHover={{ boxShadow: '0 16px 48px rgba(29,28,22,0.08)' }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Activity Log</h3>
            <div className="timeline">{activityLog.map((e, i) => (
              <motion.div key={i} className="timeline-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              >
                <div className={`timeline-dot ${e.type === 'deploy' ? 'active' : ''}`} />
                <div className="timeline-time">{e.time}</div>
                <div className="timeline-title" style={{ fontSize: '0.875rem' }}>{e.event}</div>
              </motion.div>))}</div>
          </motion.div>
        </div>

      </motion.div>
    </PageTransition>
  )
}
