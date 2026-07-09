import { useState, useEffect, useCallback, useRef } from 'react'

const SETTINGS_KEY = 'focus-timer-settings'
const STATS_KEY = 'focus-timer-stats'
const HISTORY_KEY = 'focus-timer-history'
const TASKS_KEY = 'focus-timer-tasks'

export const MODES = {
  focus: 'focus',
  shortBreak: 'shortBreak',
  longBreak: 'longBreak',
  custom: 'custom',
}

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  customDuration: 30,
  autoStartBreak: false,
  autoStartFocus: false,
  notificationSounds: true,
  volume: 0.5,
  desktopNotifications: true,
}

export const TIMER_PRESETS = {
  pomodoro: {
    label: 'Pomodoro',
    description: '25 / 5 / 15',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  deepWork: {
    label: 'Deep Work',
    description: '50 / 10 / 20',
    focusDuration: 50,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    sessionsUntilLongBreak: 3,
  },
  study: {
    label: 'Study',
    description: '45 / 15 / 25',
    focusDuration: 45,
    shortBreakDuration: 15,
    longBreakDuration: 25,
    sessionsUntilLongBreak: 4,
  },
  sprint: {
    label: 'Sprint',
    description: '15 / 3 / 10',
    focusDuration: 15,
    shortBreakDuration: 3,
    longBreakDuration: 10,
    sessionsUntilLongBreak: 6,
  },
}

const MODE_SETTING_KEY = {
  [MODES.focus]: 'focusDuration',
  [MODES.shortBreak]: 'shortBreakDuration',
  [MODES.longBreak]: 'longBreakDuration',
  [MODES.custom]: 'customDuration',
}

const DEFAULT_STATS = {
  todayFocusTime: 0,
  weeklyFocusTime: 0,
  completedSessions: 0,
  longestSession: 0,
  currentStreak: 0,
  averageFocusTime: 0,
  breakTime: 0,
  totalStudyTime: 0,
  lastActiveDate: null,
  dailySessions: 0,
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function getModeDuration(mode, settings) {
  switch (mode) {
    case MODES.focus:
      return settings.focusDuration * 60
    case MODES.shortBreak:
      return settings.shortBreakDuration * 60
    case MODES.longBreak:
      return settings.longBreakDuration * 60
    case MODES.custom:
      return settings.customDuration * 60
    default:
      return settings.focusDuration * 60
  }
}

function getModeLabel(mode) {
  switch (mode) {
    case MODES.focus:
      return 'Focus'
    case MODES.shortBreak:
      return 'Short Break'
    case MODES.longBreak:
      return 'Long Break'
    case MODES.custom:
      return 'Custom'
    default:
      return 'Focus'
  }
}

function getUpcomingMode(mode, sessionCount, settings) {
  if (mode === MODES.focus) {
    const nextCount = sessionCount + 1
    if (nextCount % settings.sessionsUntilLongBreak === 0) return MODES.longBreak
    return MODES.shortBreak
  }
  return MODES.focus
}

export function useFocusTimer() {
  const [settings, setSettings] = useState(() => loadJson(SETTINGS_KEY, DEFAULT_SETTINGS))
  const [stats, setStats] = useState(() => loadJson(STATS_KEY, DEFAULT_STATS))
  const [history, setHistory] = useState(() => loadJson(HISTORY_KEY, []))
  const [tasks, setTasks] = useState(() => loadJson(TASKS_KEY, []))

  const [mode, setMode] = useState(MODES.focus)
  const [timeLeft, setTimeLeft] = useState(() => getModeDuration(MODES.focus, loadJson(SETTINGS_KEY, DEFAULT_SETTINGS)))
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [elapsedInSession, setElapsedInSession] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ambientMode, setAmbientMode] = useState(false)

  const audioRef = useRef(null)
  const totalSeconds = getModeDuration(mode, settings)
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveJson(SETTINGS_KEY, next)
      return next
    })
  }, [])

  const getDurationForMode = useCallback(
    (targetMode, customSettings = settings) => getModeDuration(targetMode, customSettings),
    [settings]
  )

  const getCurrentModeMinutes = useCallback(() => {
    const key = MODE_SETTING_KEY[mode]
    return settings[key] ?? 25
  }, [mode, settings])

  const setModeDuration = useCallback(
    (targetMode, minutes) => {
      const key = MODE_SETTING_KEY[targetMode]
      if (!key) return
      const clamped = Math.min(180, Math.max(1, Math.round(minutes)))
      setSettings((prev) => {
        const next = { ...prev, [key]: clamped }
        saveJson(SETTINGS_KEY, next)
        return next
      })
      if (!isRunning && mode === targetMode) {
        setTimeLeft(clamped * 60)
      }
    },
    [mode, isRunning]
  )

  const adjustTimeRemaining = useCallback(
    (deltaMinutes) => {
      if (isRunning) return
      const key = MODE_SETTING_KEY[mode]
      const currentMins = settings[key] ?? 25
      const nextMins = Math.min(180, Math.max(1, currentMins + deltaMinutes))
      setSettings((prev) => {
        const next = { ...prev, [key]: nextMins }
        saveJson(SETTINGS_KEY, next)
        return next
      })
      setTimeLeft(nextMins * 60)
    },
    [mode, isRunning, settings]
  )

  const applyPreset = useCallback(
    (presetKey) => {
      const preset = TIMER_PRESETS[presetKey]
      if (!preset) return
      const { label, description, ...durations } = preset
      setSettings((prev) => {
        const next = { ...prev, ...durations }
        saveJson(SETTINGS_KEY, next)
        return next
      })
      if (!isRunning) {
        const key = MODE_SETTING_KEY[mode]
        setTimeLeft((durations[key] ?? durations.focusDuration) * 60)
      }
    },
    [mode, isRunning]
  )

  // Keep timer in sync when durations change while paused
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getModeDuration(mode, settings))
    }
  }, [
    settings.focusDuration,
    settings.shortBreakDuration,
    settings.longBreakDuration,
    settings.customDuration,
    mode,
    isRunning,
  ])

  const resetDailyStatsIfNeeded = useCallback(() => {
    const today = getTodayKey()
    setStats((prev) => {
      if (prev.lastActiveDate === today) return prev
      const next = { ...prev, todayFocusTime: 0, dailySessions: 0, lastActiveDate: today }
      saveJson(STATS_KEY, next)
      return next
    })
  }, [])

  useEffect(() => {
    resetDailyStatsIfNeeded()
  }, [resetDailyStatsIfNeeded])

  useEffect(() => {
    saveJson(SETTINGS_KEY, settings)
  }, [settings])

  useEffect(() => {
    saveJson(STATS_KEY, stats)
  }, [stats])

  useEffect(() => {
    saveJson(HISTORY_KEY, history)
  }, [history])

  useEffect(() => {
    saveJson(TASKS_KEY, tasks)
  }, [tasks])

  const playNotification = useCallback(() => {
    if (!settings.notificationSounds) return
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC'
        )
      }
      audioRef.current.volume = settings.volume
      audioRef.current.play().catch(() => {})
    } catch {
      // ignore audio errors
    }
  }, [settings.notificationSounds, settings.volume])

  const showDesktopNotification = useCallback(
    (title, body) => {
      if (!settings.desktopNotifications || !('Notification' in window)) return
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification(title, { body })
        })
      }
    },
    [settings.desktopNotifications]
  )

  const completeSession = useCallback(() => {
    const duration = getModeDuration(mode, settings)
    const completedAt = new Date().toISOString()
    const entry = {
      id: Date.now(),
      mode,
      duration,
      completedAt,
      label: getModeLabel(mode),
    }

    setHistory((prev) => [entry, ...prev].slice(0, 50))

    if (mode === MODES.focus || mode === MODES.custom) {
      setSessionCount((c) => c + 1)
      setStats((prev) => {
        const focusDuration = duration
        const newLongest = Math.max(prev.longestSession, focusDuration)
        const newCompleted = prev.completedSessions + 1
        const newTotal = prev.totalStudyTime + focusDuration
        const newToday = prev.todayFocusTime + focusDuration
        const newWeekly = prev.weeklyFocusTime + focusDuration
        const newAvg = Math.round(newTotal / newCompleted)
        const next = {
          ...prev,
          todayFocusTime: newToday,
          weeklyFocusTime: newWeekly,
          completedSessions: newCompleted,
          longestSession: newLongest,
          averageFocusTime: newAvg,
          totalStudyTime: newTotal,
          dailySessions: (prev.dailySessions || 0) + 1,
          currentStreak: (prev.currentStreak || 0) + 1,
          lastActiveDate: getTodayKey(),
        }
        saveJson(STATS_KEY, next)
        return next
      })
      playNotification()
      showDesktopNotification('Focus session complete!', 'Time for a break.')
    } else {
      setStats((prev) => {
        const next = {
          ...prev,
          breakTime: prev.breakTime + duration,
          totalStudyTime: prev.totalStudyTime + duration,
          lastActiveDate: getTodayKey(),
        }
        saveJson(STATS_KEY, next)
        return next
      })
      playNotification()
      showDesktopNotification('Break complete!', 'Ready to focus again?')
    }
  }, [mode, settings, playNotification, showDesktopNotification])

  const switchMode = useCallback(
    (newMode, autoStart = false) => {
      setIsRunning(false)
      setMode(newMode)
      setTimeLeft(getModeDuration(newMode, settings))
      setElapsedInSession(0)
      setSessionStartTime(null)
      if (autoStart) setIsRunning(true)
    },
    [settings]
  )

  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
        setElapsedInSession((prev) => prev + 1)
      }, 1000)
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false)
      completeSession()

      const upcoming =
        mode === MODES.focus || mode === MODES.custom
          ? getUpcomingMode(mode, sessionCount, settings)
          : MODES.focus

      const shouldAutoStart =
        (upcoming === MODES.focus && settings.autoStartFocus) ||
        (upcoming !== MODES.focus && settings.autoStartBreak)

      setTimeout(() => switchMode(upcoming, shouldAutoStart), 500)
    }
    return () => clearInterval(interval)
  }, [
    isRunning,
    timeLeft,
    mode,
    sessionCount,
    settings,
    completeSession,
    switchMode,
  ])

  const start = useCallback(() => {
    if (!sessionStartTime) setSessionStartTime(Date.now())
    setIsRunning(true)
  }, [sessionStartTime])

  const pause = useCallback(() => setIsRunning(false), [])

  const restart = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(getModeDuration(mode, settings))
    setElapsedInSession(0)
    setSessionStartTime(null)
  }, [mode, settings])

  const skip = useCallback(() => {
    setIsRunning(false)
    const upcoming = getUpcomingMode(mode, sessionCount, settings)
    switchMode(upcoming)
  }, [mode, sessionCount, settings, switchMode])

  const reset = useCallback(() => {
    setIsRunning(false)
    setMode(MODES.focus)
    setTimeLeft(getModeDuration(MODES.focus, settings))
    setSessionCount(0)
    setElapsedInSession(0)
    setSessionStartTime(null)
  }, [settings])

  const addTask = useCallback((text) => {
    if (!text.trim()) return
    setTasks((prev) => [...prev, { id: Date.now(), text: text.trim(), done: false }])
  }, [])

  const toggleTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const upcomingMode = getUpcomingMode(mode, sessionCount, settings)

  return {
    mode,
    modes: MODES,
    timeLeft,
    totalSeconds,
    progress,
    isRunning,
    sessionCount,
    settings,
    stats,
    history,
    tasks,
    isFullscreen,
    ambientMode,
    upcomingMode,
    getModeLabel,
    getDurationForMode,
    getCurrentModeMinutes,
    updateSettings,
    setModeDuration,
    adjustTimeRemaining,
    applyPreset,
    start,
    pause,
    restart,
    skip,
    reset,
    switchMode,
    setIsFullscreen,
    setAmbientMode,
    addTask,
    toggleTask,
    removeTask,
  }
}
