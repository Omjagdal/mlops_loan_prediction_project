import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PageTransition from '../components/PageTransition'

const mockRuns = [
  { id: 'run_001', model: 'Random Forest', f1: 0.938, accuracy: 0.942, auc: 0.967, status: 'FINISHED', duration: '4m 32s', date: '2026-04-15 11:30', params: { n_estimators: 300, max_depth: 15, min_samples_split: 5 } },
  { id: 'run_002', model: 'Gradient Boosting', f1: 0.930, accuracy: 0.935, auc: 0.959, status: 'FINISHED', duration: '6m 18s', date: '2026-04-15 11:25', params: { n_estimators: 200, max_depth: 5, learning_rate: 0.1 } },
  { id: 'run_003', model: 'Logistic Regression', f1: 0.882, accuracy: 0.887, auc: 0.914, status: 'FINISHED', duration: '0m 45s', date: '2026-04-15 11:20', params: { C: 1.0, penalty: 'l2', solver: 'lbfgs' } },
  { id: 'run_004', model: 'Random Forest', f1: 0.925, accuracy: 0.930, auc: 0.955, status: 'FINISHED', duration: '3m 55s', date: '2026-04-14 16:00', params: { n_estimators: 200, max_depth: 10 } },
]
const trendData = [
  { run: 'v1', f1: 0.850, accuracy: 0.860 }, { run: 'v2', f1: 0.872, accuracy: 0.878 },
  { run: 'v3', f1: 0.895, accuracy: 0.901 }, { run: 'v4', f1: 0.918, accuracy: 0.922 },
  { run: 'v5', f1: 0.925, accuracy: 0.930 }, { run: 'v6', f1: 0.930, accuracy: 0.935 },
  { run: 'v7', f1: 0.938, accuracy: 0.942 },
]

const chartTooltipStyle = {
  background: 'rgba(254,249,240,0.95)',
  backdropFilter: 'blur(12px)',
  border: 'none',
  borderRadius: '16px',
  color: '#1d1c16',
}

export default function Experiments() {
  const [sel, setSel] = useState(mockRuns[0])
  return (
    <PageTransition>
      <div className="page-header">
        <p className="text-label" style={{ color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '8px' }}>MLFLOW TRACKING</p>
        <h1>Experiment Tracking</h1>
        <p>Model training runs and metrics progression — V2 pipeline.</p>
      </div>
      <div className="glass-card-glow animate-scale-in" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="text-label" style={{ marginBottom: '4px' }}>PRODUCTION MODEL</div>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>loan_prediction_model <span className="badge badge-success" style={{ marginLeft: '12px' }}>v2.0</span></div>
          <div style={{ color: 'var(--on-surface-variant)', marginTop: '4px', fontSize: '0.875rem' }}>Random Forest · F1: 93.8% · 52+ Features</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="pulse-indicator" /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>Active</span></div>
      </div>
      <div className="section-grid" style={{ gridTemplateColumns: '1fr 1.5fr', alignItems: 'start' }}>
        <div className="glass-card"><h3 className="text-title" style={{ marginBottom: '24px' }}>Run Timeline</h3>
          <div className="timeline">{mockRuns.map((r, i) => (
            <div key={r.id} className="timeline-item" onClick={() => setSel(r)} style={{ cursor: 'pointer', opacity: sel.id === r.id ? 1 : 0.5, transition: 'opacity 0.3s' }}>
              <div className={`timeline-dot ${i === 0 ? 'active' : ''}`} /><div className="timeline-time">{r.date}</div>
              <div className="timeline-title">{r.model}</div>
              <div className="timeline-desc">F1: {(r.f1*100).toFixed(1)}% · {r.duration}{i===0 && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Best</span>}</div>
            </div>))}</div></div>
        <div>
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 className="text-title" style={{ marginBottom: '16px' }}>{sel.model} <span className="badge badge-neutral" style={{ marginLeft: '12px' }}>{sel.id}</span></h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
              <div><div className="text-label">F1 Score</div><div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(sel.f1*100).toFixed(1)}%</div></div>
              <div><div className="text-label">Accuracy</div><div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-container)' }}>{(sel.accuracy*100).toFixed(1)}%</div></div>
              <div><div className="text-label">ROC AUC</div><div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>{(sel.auc*100).toFixed(1)}%</div></div>
            </div>
            <h4 className="text-label" style={{ marginBottom: '12px' }}>Hyperparameters</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(sel.params).map(([k, v]) => (<div key={k} className="badge badge-neutral" style={{ padding: '6px 16px' }}><span style={{ color: 'var(--text-muted)' }}>{k}: </span><span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{v}</span></div>))}
            </div>
          </div>
          <div className="glass-card"><h3 className="text-title" style={{ marginBottom: '24px' }}>Metrics Progression</h3>
            <ResponsiveContainer width="100%" height={220}><LineChart data={trendData}>
              <XAxis dataKey="run" stroke="#bbcbbb" fontSize={11} /><YAxis stroke="#bbcbbb" fontSize={11} domain={[0.8, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => `${(v*100).toFixed(1)}%`} />
              <Line type="monotone" dataKey="f1" stroke="#006d37" strokeWidth={2.5} dot={{ fill: '#006d37', r: 4 }} name="F1" />
              <Line type="monotone" dataKey="accuracy" stroke="#2ecc71" strokeWidth={2} dot={{ fill: '#2ecc71', r: 3 }} name="Accuracy" />
            </LineChart></ResponsiveContainer></div></div></div>
      <div className="glass-card" style={{ marginTop: '24px' }}><h3 className="text-title" style={{ marginBottom: '16px' }}>All Runs</h3>
        <table className="data-table"><thead><tr><th>Run ID</th><th>Model</th><th>F1</th><th>Accuracy</th><th>AUC</th><th>Duration</th><th>Status</th></tr></thead>
          <tbody>{mockRuns.map(r => (<tr key={r.id} onClick={() => setSel(r)} style={{ cursor: 'pointer' }}>
            <td><code style={{ color: 'var(--primary)', fontSize: '0.8125rem' }}>{r.id}</code></td>
            <td style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{r.model}</td>
            <td>{(r.f1*100).toFixed(1)}%</td><td>{(r.accuracy*100).toFixed(1)}%</td><td>{(r.auc*100).toFixed(1)}%</td>
            <td>{r.duration}</td><td><span className="badge badge-success">{r.status}</span></td></tr>))}</tbody></table></div>
    </PageTransition>)
}
