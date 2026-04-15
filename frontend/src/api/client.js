import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export const predictLoan = async (application) => {
  const response = await api.post('/predict', application)
  return response.data
}

export const batchPredict = async (applications) => {
  const response = await api.post('/predict/batch', { applications })
  return response.data
}

export const getModelInfo = async () => {
  const response = await api.get('/model/info')
  return response.data
}

export const getFeatureImportance = async () => {
  const response = await api.get('/model/features')
  return response.data
}

export const getHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export const getRiskFactors = async (params) => {
  const response = await api.get('/risk-factors', { params })
  return response.data
}

export default api
