import { createContext, useContext, useState } from 'react'

const PredictionContext = createContext()

export function PredictionProvider({ children }) {
  const [predictionResult, setPredictionResult] = useState(null)
  const [predictionHistory, setPredictionHistory] = useState([])
  const [lastApplication, setLastApplication] = useState(null)

  const addPrediction = (application, result) => {
    setLastApplication(application)
    setPredictionResult(result)
    setPredictionHistory(prev => [
      { id: Date.now(), application, result, timestamp: new Date().toISOString() },
      ...prev.slice(0, 49) // Keep last 50
    ])
  }

  const clearResult = () => {
    setPredictionResult(null)
    setLastApplication(null)
  }

  return (
    <PredictionContext.Provider value={{
      predictionResult,
      predictionHistory,
      lastApplication,
      addPrediction,
      clearResult,
    }}>
      {children}
    </PredictionContext.Provider>
  )
}

export function usePrediction() {
  const context = useContext(PredictionContext)
  if (!context) {
    throw new Error('usePrediction must be used within PredictionProvider')
  }
  return context
}
