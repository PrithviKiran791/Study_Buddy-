import { useState, useEffect, useCallback } from 'react'

export default function usePomodoro() {
  const getCustomTimes = () => {
    const workMin = parseInt(localStorage.getItem('pomodoro_work_minutes')) || 25
    const breakMin = parseInt(localStorage.getItem('pomodoro_break_minutes')) || 5
    return {
      work: workMin * 60,
      break: breakMin * 60
    }
  }

  const [mode, setMode] = useState('work') // 'work' or 'break'
  const [timeLeft, setTimeLeft] = useState(() => {
    const times = getCustomTimes()
    return times.work
  })
  const [isRunning, setIsRunning] = useState(false)

  // Listen to mode changes to load custom times
  useEffect(() => {
    const times = getCustomTimes()
    setTimeLeft(mode === 'work' ? times.work : times.break)
  }, [mode])

  // Sync timeLeft if timer is not running
  useEffect(() => {
    if (!isRunning) {
      const times = getCustomTimes()
      setTimeLeft(mode === 'work' ? times.work : times.break)
    }
  }, [isRunning, mode])

  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      // Switch modes automatically
      const times = getCustomTimes()
      if (mode === 'work') {
        setMode('break')
        setTimeLeft(times.break)
      } else {
        setMode('work')
        setTimeLeft(times.work)
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, mode])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  
  const reset = useCallback(() => {
    setIsRunning(false)
    const times = getCustomTimes()
    setTimeLeft(mode === 'work' ? times.work : times.break)
  }, [mode])

  const changeMode = useCallback((newMode) => {
    setIsRunning(false)
    setMode(newMode)
    const times = getCustomTimes()
    setTimeLeft(newMode === 'work' ? times.work : times.break)
  }, [])

  const adjustTime = useCallback((amountSeconds) => {
    if (isRunning) return
    setTimeLeft((prev) => {
      const next = Math.max(60, prev + amountSeconds)
      const nextMin = Math.floor(next / 60)
      if (mode === 'work') {
        localStorage.setItem('pomodoro_work_minutes', nextMin)
      } else {
        localStorage.setItem('pomodoro_break_minutes', nextMin)
      }
      return next
    })
  }, [isRunning, mode])

  return {
    timeLeft,
    isRunning,
    mode,
    start,
    pause,
    reset,
    changeMode,
    adjustTime,
  }
}
