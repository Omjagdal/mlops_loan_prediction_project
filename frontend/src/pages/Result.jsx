import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePrediction } from '../context/PredictionContext'

import AnimatedCounter from '../components/AnimatedCounter'

export default function Result() {
  const { predictionResult, lastApplication } = usePrediction()
  const navigate = useNavigate()

  if (!predictionResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="animate-fade-up" 
        style={{ textAlign: 'center', paddingTop: '120px' }}
      >
        <h2 className="text-headline" style={{ marginBottom: '12px' }}>No Prediction Result</h2>
        <p className="text-body" style={{ marginBottom: '32px' }}>Submit a loan application to see the AI decision.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')}>Make a Prediction</button>
      </motion.div>
    )
  }

  const { prediction, probability, confidence, risk_level, feature_contributions, explanation } = predictionResult
  const isApproved = prediction === 'Approved'
  const gaugePercent = (probability * 100).toFixed(1)
  const gaugeColor = isApproved ? '#4ADE80' : '#FF6B6B'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="animate-fade-up"
    >
      <div className="page-header">
        <p className="text-label" style={{ color: 'var(--ember)', letterSpacing: '0.15em', marginBottom: '8px' }}>AI DECISION</p>
        <h1>Prediction Result</h1>
      </div>

      <div className="section-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        {/* Decision Card */}
        <div className={`glass-card decision-card ${isApproved ? 'approved' : 'rejected'} animate-scale-in`} style={{ animationDelay: '100ms' }}>
          <div className={`decision-label ${isApproved ? 'approved' : 'rejected'}`} style={{ marginBottom: '8px' }}>
            {isApproved ? 'APPROVED' : 'REJECTED'}
          </div>

          {/* SVG Gauge */}
          <div style={{ width: '200px', height: '200px', margin: '24px auto', position: 'relative' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-container-highest)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={gaugeColor}
                strokeWidth="2.5" strokeDasharray={`${gaugePercent} ${100 - gaugePercent}`}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${gaugeColor})`, transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
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
        </div>

        {/* Feature Contributions */}
        <div className="glass-card animate-fade-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-title" style={{ marginBottom: '24px' }}>Feature Contributions</h3>
          <p className="text-body" style={{ marginBottom: '24px' }}>Top factors influencing the AI decision:</p>
          {feature_contributions.length > 0 ? (
            feature_contributions.map((fc, i) => {
              const maxContrib = Math.max(...feature_contributions.map(f => f.contribution))
              const width = (fc.contribution / maxContrib) * 100
              return (
                <div key={i} className="feature-bar" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="feature-bar-name">{fc.feature.replace(/_/g, ' ')}</span>
                  <div className="feature-bar-track">
                    <div className={`feature-bar-fill ${fc.direction}`}
                      style={{ width: `${width}%`, transitionDelay: `${i * 100}ms` }} />
                  </div>
                  <span className="feature-bar-value">{(fc.contribution * 100).toFixed(1)}%</span>
                </div>
              )
            })
          ) : <p className="text-body">No feature contributions available.</p>}
        </div>
      </div>

      {/* Explanation */}
      <div className="glass-card animate-fade-up" style={{ margin: '24px 0', animationDelay: '500ms' }}>
        <h3 className="text-title" style={{ marginBottom: '12px' }}>AI Explanation</h3>
        <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{explanation}</p>
      </div>

      {/* Application Summary */}
      {lastApplication && (
        <div className="glass-card animate-fade-up" style={{ marginBottom: '32px', animationDelay: '600ms' }}>
          <h3 className="text-title" style={{ marginBottom: '16px' }}>Application Summary</h3>
          <div className="form-grid-3">
            {Object.entries(lastApplication).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '8px' }}>
                <span className="text-label" style={{ display: 'block', marginBottom: '2px' }}>{key.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')}>New Prediction</button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>Dashboard</button>
      </div>
    </motion.div>
  )
}
