import { motion } from 'framer-motion'

/**
 * PipelineDiagram — Production-grade ML pipeline flowchart
 * Enterprise 2D visualization of the end-to-end MLOps data flow
 */

const stages = [
  {
    id: 'ingest',
    label: 'Data Ingestion',
    tech: 'DVC Pipeline',
    metric: '20K rows',
    throughput: '2.3 MB/s',
    status: 'active',
  },
  {
    id: 'features',
    label: 'Feature Store',
    tech: 'Pandas Engine',
    metric: '55 features',
    throughput: '1.2s avg',
    status: 'active',
  },
  {
    id: 'train',
    label: 'Model Training',
    tech: 'scikit-learn',
    metric: 'F1: 93.8%',
    throughput: 'GridSearchCV',
    status: 'idle',
  },
  {
    id: 'gates',
    label: 'Readiness Gates',
    tech: 'evaluate.py',
    metric: 'ALL PASS',
    throughput: 'Bias + Overfit',
    status: 'passed',
  },
  {
    id: 'registry',
    label: 'Model Registry',
    tech: 'Supabase + MLflow',
    metric: 'v2.4',
    throughput: 'model.pkl',
    status: 'active',
  },
  {
    id: 'prod',
    label: 'Production API',
    tech: 'FastAPI + Docker',
    metric: '42ms p95',
    throughput: '99.9% uptime',
    status: 'active',
  },
]

const STATUS = {
  active:  { bg: 'linear-gradient(135deg, rgba(0,109,55,0.06), rgba(46,204,113,0.10))', border: 'rgba(0,109,55,0.35)', glow: '#2ecc71', text: '#006d37', badge: '#006d37', badgeText: '#fff', label: 'ACTIVE' },
  idle:    { bg: 'linear-gradient(135deg, rgba(124,88,0,0.06), rgba(240,180,41,0.10))', border: 'rgba(124,88,0,0.30)', glow: '#f0b429', text: '#7c5800', badge: '#7c5800', badgeText: '#fff', label: 'IDLE' },
  passed:  { bg: 'linear-gradient(135deg, rgba(0,109,55,0.08), rgba(46,204,113,0.14))', border: 'rgba(0,109,55,0.45)', glow: '#006d37', text: '#006d37', badge: '#006d37', badgeText: '#fff', label: 'PASSED' },
  error:   { bg: 'linear-gradient(135deg, rgba(186,26,26,0.06), rgba(231,76,60,0.10))', border: 'rgba(186,26,26,0.35)', glow: '#e74c3c', text: '#ba1a1a', badge: '#ba1a1a', badgeText: '#fff', label: 'ERROR' },
}

/* ── SVG Icons for each stage ── */
const ICONS = {
  ingest: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  features: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  train: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  gates: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  registry: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  prod: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
}

/* ── Animated Connection Arrow ── */
function ConnectionArrow() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      position: 'relative',
      width: '44px',
      height: '100%',
    }}>
      {/* Base line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '0',
        right: '8px',
        height: '2px',
        background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-container) 100%)',
        opacity: 0.35,
        transform: 'translateY(-50%)',
      }} />
      {/* Animated pulse traveling along the line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '0',
        width: '12px',
        height: '2px',
        background: 'var(--primary-container)',
        borderRadius: '1px',
        transform: 'translateY(-50%)',
        animation: 'pipeline-data-pulse 2s ease-in-out infinite',
        boxShadow: '0 0 6px var(--primary-container)',
      }} />
      {/* Arrowhead */}
      <div style={{
        position: 'absolute',
        right: '0',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: '7px solid var(--primary)',
        opacity: 0.6,
      }} />
    </div>
  )
}

/* ── Single Stage Node ── */
function StageNode({ stage, index }) {
  const s = STATUS[stage.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: '14px',
        padding: '18px 14px 14px',
        width: '152px',
        flexShrink: 0,
        position: 'relative',
        cursor: 'default',
        transition: 'box-shadow 0.35s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.06), 0 0 0 1px ${s.border}`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Step number badge */}
      <div style={{
        position: 'absolute',
        top: '-8px',
        left: '-8px',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: s.badge,
        color: s.badgeText,
        fontSize: '0.625rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        boxShadow: `0 2px 8px ${s.badge}33`,
      }}>
        {index + 1}
      </div>

      {/* Pulsing status dot */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: s.glow,
        boxShadow: (stage.status === 'active' || stage.status === 'passed') ? `0 0 6px ${s.glow}` : 'none',
      }}>
        {stage.status === 'active' && (
          <div style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '50%',
            background: s.glow,
            opacity: 0.3,
            animation: 'pipeline-dot-pulse 2s infinite',
          }} />
        )}
      </div>

      {/* Icon */}
      <div style={{ color: s.text, marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
        {ICONS[stage.id]}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-headline)',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--on-surface)',
        lineHeight: 1.3,
        textAlign: 'center',
        marginBottom: '2px',
      }}>
        {stage.label}
      </div>

      {/* Tech stack */}
      <div style={{
        fontSize: '0.625rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '10px',
        fontFamily: 'var(--font-body)',
      }}>
        {stage.tech}
      </div>

      {/* Metrics row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        marginBottom: '4px',
      }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '6px',
          background: `${s.badge}15`,
          border: `1px solid ${s.badge}25`,
          color: s.text,
          fontSize: '0.5625rem',
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.02em',
        }}>
          {stage.metric}
        </span>
      </div>

      {/* Throughput */}
      <div style={{
        fontSize: '0.5625rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
      }}>
        {stage.throughput}
      </div>
    </motion.div>
  )
}

export default function PipelineDiagram() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Scoped keyframes */}
      <style>{`
        @keyframes pipeline-data-pulse {
          0% { left: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: calc(100% - 20px); opacity: 0; }
        }
        @keyframes pipeline-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Pipeline flow — horizontally scrollable */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '28px 24px 20px',
        overflowX: 'auto',
        overflowY: 'visible',
        /* hide scrollbar but allow scroll */
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <StageNode stage={stage} index={i} />
            {i < stages.length - 1 && <ConnectionArrow />}
          </div>
        ))}
      </div>

      {/* Legend bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        padding: '0 24px 18px',
      }}>
        {[
          { label: 'Active', color: '#2ecc71' },
          { label: 'Idle', color: '#f0b429' },
          { label: 'Passed', color: '#006d37' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: item.color,
              boxShadow: `0 0 4px ${item.color}55`,
            }} />
            <span style={{
              fontSize: '0.625rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.03em',
            }}>
              {item.label}
            </span>
          </div>
        ))}
        <div style={{ width: '1px', height: '12px', background: 'var(--outline-variant)', opacity: 0.4 }} />
        <span style={{
          fontSize: '0.625rem',
          color: 'var(--text-muted)',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
        }}>
          6 stages · End-to-end automated
        </span>
      </div>
    </div>
  )
}
