import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  ChevronUp,
  ChevronDown,
  Maximize2,
  GripVertical,
  Settings2,
} from 'lucide-react'
import { useFocusTimerContext } from '@/context/FocusTimerContext'
import FocusTimerCustomizer from '@/components/focus/FocusTimerCustomizer'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function FocusTimerWidget() {
  const location = useLocation()
  const {
    mode,
    timeLeft,
    progress,
    isRunning,
    stats,
    upcomingMode,
    getModeLabel,
    start,
    pause,
    restart,
    skip,
    switchMode,
    setIsFullscreen,
    settings,
  } = useFocusTimerContext()

  const [collapsed, setCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('focus-widget-position')
      return saved ? JSON.parse(saved) : { x: 0, y: 0 }
    } catch {
      return { x: 0, y: 0 }
    }
  })

  useEffect(() => {
    localStorage.setItem('focus-widget-position', JSON.stringify(position))
  }, [position])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault()
        isRunning ? pause() : start()
      }
      if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault()
        restart()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, start, pause, restart])

  const circumference = 2 * Math.PI * 42
  const strokeOffset = circumference - (circumference * progress) / 100

  if (location.pathname === '/focus-center') return null

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        setPosition({ x: info.offset.x, y: info.offset.y })
      }}
      style={{ x: position.x, y: position.y }}
      className="fixed bottom-6 right-6 z-50 w-72"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="glass-card overflow-hidden border-border bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="muted" className="text-[9px]">
              {getModeLabel(mode)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', showSettings && 'bg-accent')}
              onClick={() => setShowSettings(!showSettings)}
              title="Customize timer"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFullscreen(true)}
              title="Fullscreen focus mode"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                <div className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-muted"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-primary transition-all duration-1000 ease-linear"
                      strokeWidth="4"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="font-mono text-2xl font-light tracking-tight">
                      {formatDuration(timeLeft)}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      Next: {getModeLabel(upcomingMode)}
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap justify-center gap-1">
                  {['focus', 'shortBreak', 'longBreak', 'custom'].map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={cn(
                        'rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wider transition-colors',
                        mode === m
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {getModeLabel(m)}
                      <span className="ml-0.5 opacity-70">
                        {m === 'focus' && settings.focusDuration}
                        {m === 'shortBreak' && settings.shortBreakDuration}
                        {m === 'longBreak' && settings.longBreakDuration}
                        {m === 'custom' && settings.customDuration}
                      </span>
                    </button>
                  ))}
                </div>

                {showSettings && (
                  <div className="mb-3 rounded-lg border border-border bg-muted/20 p-3">
                    <FocusTimerCustomizer compact />
                  </div>
                )}

                <div className="mb-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <span>Today: {stats.dailySessions || 0} sessions</span>
                  <span>{formatDuration(stats.todayFocusTime || 0)}</span>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" onClick={isRunning ? pause : start}>
                    {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={restart} title="Restart">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={skip} title="Skip">
                    <SkipForward className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Link
                  to="/focus-center"
                  className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Timer className="h-3 w-3" />
                  Open Focus Center
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="font-mono text-lg font-light">{formatDuration(timeLeft)}</span>
              <Button size="icon" className="h-8 w-8" onClick={isRunning ? pause : start}>
                {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
