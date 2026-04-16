import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePrediction } from '../context/PredictionContext'
import AnimatedCounter from '../components/AnimatedCounter'
import PageTransition, { itemVariants } from '../components/PageTransition'

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const scaleInVariants = {
  initial: { opacity: 0, scale: 0.85, filter: 'blur(6px)' },
  animate: {
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

const slideRightVariants = {
  initial: { opacity: 0, x: 40 },
  animate: {
    opacity: 1, x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

export default function Result() {
  const { predictionResult, lastApplication } = usePrediction()
  const navigate = useNavigate()

  if (!predictionResult) {
    return (
      <PageTransition>
        <div style={{ textAlign: 'center', paddingTop: '120px' }}>
          <motion.h2 className="text-headline" style={{ marginBottom: '12px' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >No Prediction Result</motion.h2>
          <motion.p className="text-body" style={{ marginBottom: '32px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
          >Submit a loan application to see the AI decision.</motion.p>
          <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(0, 109, 55, 0.25)' }}
            whileTap={{ scale: 0.97 }}
          >Make a Prediction</motion.button>
        </div>
      </PageTransition>
    )
  }

  const { prediction, probability, confidence, risk_level, feature_contributions, explanation } = predictionResult
  const isApproved = prediction === 'Approved'
  const gaugePercent = (probability * 100).toFixed(1)
  const gaugeColor = isApproved ? '#006d37' : '#ba1a1a'

  return (
    <PageTransition>
      <motion.div variants={containerVariants} initial="initial" animate="animate">
        <motion.div className="page-header" variants={itemVariants}>
          <p className="text-label" style={{ color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '8px' }}>AI DECISION</p>
          <h1>Prediction Result</h1>
        </motion.div>

        <div className="section-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          {/* Decision Card — dramatic scale-in */}
          <motion.div
            className={`glass-card decision-card ${isApproved ? 'approved' : 'rejected'}`}
            variants={scaleInVariants}
            whileHover={{
              boxShadow: isApproved
                ? '0 0 80px rgba(0, 109, 55, 0.12)'
                : '0 0 80px rgba(186, 26, 26, 0.12)',
              transition: { duration: 0.4 },
            }}
          >
            <motion.div
              className={`decision-label ${isApproved ? 'approved' : 'rejected'}`}
              style={{ marginBottom: '8px' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {isApproved ? 'APPROVED' : 'REJECTED'}
            </motion.div>

            {/* SVG Gauge */}
            <div style={{ width: '200px', height: '200px', margin: '24px auto', position: 'relative' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-container-highest)" strokeWidth="2.5" />
                <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={gaugeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${gaugePercent} ${100 - gaugePercent}` }}
                  transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: `drop-shadow(0 0 8px ${gaugeColor})` }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  <AnimatedCounter target={parseFloat(gaugePercent)} decimals={1} suffix="%" duration={1500} />
                </span>
                <span className="text-label" style={{ marginTop: '4px' }}>Probability</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '20px' }}>
              <div>
                <span className="text-label">Confidence</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>
                  <AnimatedCounter target={confidence * 100} decimals={1} suffix="%" />
                </div>
              </div>
              <div>
                <span className="text-label">Risk Level</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge ${risk_level === 'Low' ? 'badge-success' : risk_level === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                    {risk_level}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Contributions — slide in from right */}
          <motion.div className="glass-card" variants={slideRightVariants}>
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Feature Contributions</h3>
            <p className="text-body" style={{ marginBottom: '24px' }}>Top factors influencing the AI decision:</p>
            {feature_contributions.length > 0 ? (
              feature_contributions.map((fc, i) => {
                const maxContrib = Math.max(...feature_contributions.map(f => f.contribution))
                const width = (fc.contribution / maxContrib) * 100
                return (
                  <motion.div key={i} className="feature-bar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="feature-bar-name">{fc.feature.replace(/_/g, ' ')}</span>
                    <div className="feature-bar-track">
                      <motion.div className={`feature-bar-fill ${fc.direction}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span className="feature-bar-value">{(fc.contribution * 100).toFixed(1)}%</span>
                  </motion.div>
                )
              })
            ) : <p className="text-body">No feature contributions available.</p>}
          </motion.div>
        </div>

        {/* Explanation */}
        <motion.div className="glass-card" style={{ margin: '24px 0' }} variants={itemVariants}>
          <h3 className="text-title" style={{ marginBottom: '12px' }}>AI Explanation</h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--on-surface-variant)' }}>{explanation}</p>
        </motion.div>

        {/* Application Summary */}
        {lastApplication && (
          <motion.div className="glass-card" style={{ marginBottom: '32px' }} variants={itemVariants}>
            <h3 className="text-title" style={{ marginBottom: '16px' }}>Application Summary</h3>
            <div className="form-grid-3">
              {Object.entries(lastApplication).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <span className="text-label" style={{ display: 'block', marginBottom: '2px' }}>{key.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--on-surface)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }} variants={itemVariants}>
          <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')}
            whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(0, 109, 55, 0.25)' }}
            whileTap={{ scale: 0.97 }}
          >New Prediction</motion.button>
          <motion.button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >Dashboard</motion.button>
        </motion.div>
      </motion.div>
    </PageTransition>
  )
}
