import { createContext, useContext } from 'react'
import { useFocusTimer } from '@/hooks/useFocusTimer'

const FocusTimerContext = createContext(null)

export function FocusTimerProvider({ children }) {
  const timer = useFocusTimer()
  return <FocusTimerContext.Provider value={timer}>{children}</FocusTimerContext.Provider>
}

export function useFocusTimerContext() {
  const ctx = useContext(FocusTimerContext)
  if (!ctx) throw new Error('useFocusTimerContext must be used within FocusTimerProvider')
  return ctx
}
