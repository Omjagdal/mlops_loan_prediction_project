import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { predictLoan } from '../api/client'
import { usePrediction } from '../context/PredictionContext'
import PageTransition, { itemVariants } from '../components/PageTransition'

const initialForm = {
  age: 35, gender: 'Male', marital_status: 'Married', education_level: "Bachelor's",
  annual_income: 55000, monthly_income: 4583, employment_status: 'Employed',
  debt_to_income_ratio: 0.25, credit_score: 720, loan_amount: 15000,
  loan_purpose: 'Car', interest_rate: 10.5, loan_term: 36, installment: 487.5,
  grade_subgrade: 'B3', num_of_open_accounts: 5, total_credit_limit: 35000,
  current_balance: 12000, delinquency_history: 0, public_records: 0, num_of_delinquencies: 0,
}

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const cardVariants = {
  initial: { opacity: 0, y: 25, scale: 0.97 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export default function Predict() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { addPrediction } = usePrediction()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'number' || type === 'range' ? parseFloat(value) : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await predictLoan(form)
      addPrediction(form, result)
      navigate('/result')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Prediction failed')
    } finally { setLoading(false) }
  }

  // Real-time risk indicators
  const dtiRisk = form.debt_to_income_ratio > 0.4 ? 'High' : form.debt_to_income_ratio > 0.25 ? 'Medium' : 'Low'
  const creditRisk = form.credit_score < 580 ? 'High' : form.credit_score < 670 ? 'Medium' : 'Low'
  const ltiRisk = (form.loan_amount / (form.annual_income || 1)) > 0.5 ? 'High' : (form.loan_amount / (form.annual_income || 1)) > 0.3 ? 'Medium' : 'Low'
  const riskColor = (l) => l === 'High' ? 'var(--danger)' : l === 'Medium' ? 'var(--warning)' : 'var(--emerald)'

  const affordability = ((form.monthly_income - form.installment) / (form.monthly_income || 1) * 100).toFixed(0)

  return (
    <PageTransition>
      <motion.div variants={containerVariants} initial="initial" animate="animate">
        <motion.div className="page-header" variants={itemVariants}>
          <p className="text-label" style={{ color: 'var(--ember)', letterSpacing: '0.15em', marginBottom: '8px' }}>LOAN APPLICATION</p>
          <h1>Submit Loan Application</h1>
          <p>Fill in applicant details for AI-powered decisioning with V2 feature intelligence.</p>
        </motion.div>

        {/* Risk Dashboard */}
        <motion.div className="stats-grid" variants={containerVariants} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'DTI Risk', value: dtiRisk, sub: `Ratio: ${(form.debt_to_income_ratio * 100).toFixed(0)}%`, risk: dtiRisk },
            { label: 'Credit Risk', value: creditRisk, sub: `Score: ${form.credit_score}`, risk: creditRisk },
            { label: 'Loan-to-Income', value: ltiRisk, sub: `Ratio: ${((form.loan_amount / (form.annual_income || 1)) * 100).toFixed(0)}%`, risk: ltiRisk },
            { label: 'Affordability', value: `${affordability}%`, sub: 'Post-installment income', risk: affordability > 60 ? 'Low' : affordability > 30 ? 'Medium' : 'High' },
          ].map((r, i) => (
            <motion.div key={i} className="stat-card" variants={cardVariants}
              whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(255,140,66,0.12)', transition: { duration: 0.25 } }}
            >
              <div className="stat-label">{r.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: riskColor(r.risk), marginTop: '4px' }}>{r.value}</div>
              <div className="stat-delta">{r.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Personal */}
          <motion.div className="glass-card" style={{ marginBottom: '24px' }} variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Personal Information</h3>
            <div className="form-grid-3">
              <div className="form-group"><label className="form-label">Age</label>
                <input type="number" name="age" value={form.age} onChange={handleChange} className="form-input" min="18" max="100" /></div>
              <div className="form-group"><label className="form-label">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="form-select"><option>Male</option><option>Female</option></select></div>
              <div className="form-group"><label className="form-label">Marital Status</label>
                <select name="marital_status" value={form.marital_status} onChange={handleChange} className="form-select"><option>Single</option><option>Married</option><option>Divorced</option></select></div>
              <div className="form-group"><label className="form-label">Education Level</label>
                <select name="education_level" value={form.education_level} onChange={handleChange} className="form-select"><option>High School</option><option value="Bachelor's">Bachelor&apos;s</option><option value="Master's">Master&apos;s</option><option>PhD</option></select></div>
              <div className="form-group"><label className="form-label">Employment Status</label>
                <select name="employment_status" value={form.employment_status} onChange={handleChange} className="form-select"><option>Employed</option><option>Self-employed</option><option>Unemployed</option><option>Retired</option></select></div>
            </div>
          </motion.div>

          {/* Financial */}
          <motion.div className="glass-card" style={{ marginBottom: '24px' }} variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Financial Information</h3>
            <div className="form-grid-3">
              <div className="form-group"><label className="form-label">Annual Income ($)</label>
                <input type="number" name="annual_income" value={form.annual_income} onChange={handleChange} className="form-input" min="0" step="1000" /></div>
              <div className="form-group"><label className="form-label">Monthly Income ($)</label>
                <input type="number" name="monthly_income" value={form.monthly_income} onChange={handleChange} className="form-input" min="0" step="100" /></div>
              <div className="form-group"><label className="form-label">Debt-to-Income Ratio</label>
                <input type="range" name="debt_to_income_ratio" value={form.debt_to_income_ratio} onChange={handleChange} className="form-range" min="0" max="1" step="0.01" />
                <div className="form-helper" style={{ color: riskColor(dtiRisk) }}>{(form.debt_to_income_ratio * 100).toFixed(0)}% — {dtiRisk} Risk</div></div>
              <div className="form-group"><label className="form-label">Credit Score</label>
                <input type="range" name="credit_score" value={form.credit_score} onChange={handleChange} className="form-range" min="300" max="850" step="1" />
                <div className="form-helper" style={{ color: riskColor(creditRisk) }}>{form.credit_score} — {creditRisk} Risk</div></div>
              <div className="form-group"><label className="form-label">Total Credit Limit ($)</label>
                <input type="number" name="total_credit_limit" value={form.total_credit_limit} onChange={handleChange} className="form-input" min="0" step="1000" /></div>
              <div className="form-group"><label className="form-label">Current Balance ($)</label>
                <input type="number" name="current_balance" value={form.current_balance} onChange={handleChange} className="form-input" min="0" step="500" /></div>
            </div>
          </motion.div>

          {/* Loan Details */}
          <motion.div className="glass-card" style={{ marginBottom: '24px' }} variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Loan Details</h3>
            <div className="form-grid-3">
              <div className="form-group"><label className="form-label">Loan Amount ($)</label>
                <input type="number" name="loan_amount" value={form.loan_amount} onChange={handleChange} className="form-input" min="100" step="500" /></div>
              <div className="form-group"><label className="form-label">Loan Purpose</label>
                <select name="loan_purpose" value={form.loan_purpose} onChange={handleChange} className="form-select"><option>Car</option><option>Home</option><option>Business</option><option>Education</option><option value="Debt consolidation">Debt Consolidation</option><option>Other</option></select></div>
              <div className="form-group"><label className="form-label">Interest Rate (%)</label>
                <input type="number" name="interest_rate" value={form.interest_rate} onChange={handleChange} className="form-input" min="0.1" max="40" step="0.1" /></div>
              <div className="form-group"><label className="form-label">Loan Term (months)</label>
                <select name="loan_term" value={form.loan_term} onChange={handleChange} className="form-select"><option value="12">12</option><option value="24">24</option><option value="36">36</option><option value="48">48</option><option value="60">60</option></select></div>
              <div className="form-group"><label className="form-label">Monthly Installment ($)</label>
                <input type="number" name="installment" value={form.installment} onChange={handleChange} className="form-input" min="0" step="10" /></div>
              <div className="form-group"><label className="form-label">Grade / Subgrade</label>
                <input type="text" name="grade_subgrade" value={form.grade_subgrade} onChange={handleChange} className="form-input" placeholder="e.g., B3" /></div>
            </div>
          </motion.div>

          {/* Credit History */}
          <motion.div className="glass-card" style={{ marginBottom: '32px' }} variants={cardVariants}
            whileHover={{ borderColor: 'rgba(255,140,66,0.2)', transition: { duration: 0.3 } }}
          >
            <h3 className="text-title" style={{ marginBottom: '24px' }}>Credit History</h3>
            <div className="form-grid-3">
              <div className="form-group"><label className="form-label">Open Accounts</label>
                <input type="number" name="num_of_open_accounts" value={form.num_of_open_accounts} onChange={handleChange} className="form-input" min="0" /></div>
              <div className="form-group"><label className="form-label">Delinquency History</label>
                <select name="delinquency_history" value={form.delinquency_history} onChange={handleChange} className="form-select"><option value={0}>No Delinquency</option><option value={1}>Has Delinquency</option></select></div>
              <div className="form-group"><label className="form-label">Public Records</label>
                <input type="number" name="public_records" value={form.public_records} onChange={handleChange} className="form-input" min="0" /></div>
              <div className="form-group"><label className="form-label">Number of Delinquencies</label>
                <input type="number" name="num_of_delinquencies" value={form.num_of_delinquencies} onChange={handleChange} className="form-input" min="0" /></div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              className="glass-card"
              style={{ marginBottom: '24px', borderColor: 'rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.05)' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ color: 'var(--danger)', textAlign: 'center', fontWeight: '500' }}>{error}</p>
            </motion.div>
          )}

          <motion.div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }} variants={itemVariants}>
            <motion.button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: '260px' }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 140, 66, 0.4)' }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (<><span className="spinner" style={{ width: '20px', height: '20px', margin: 0, borderWidth: '2px' }} /> Analyzing...</>) : 'Analyze Application'}
            </motion.button>
            <motion.button type="button" className="btn btn-secondary btn-lg" onClick={() => setForm(initialForm)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Reset
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </PageTransition>
  )
}
