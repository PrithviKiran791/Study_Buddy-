import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Minimize2 } from 'lucide-react'
import { useFocusTimerContext } from '@/context/FocusTimerContext'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const QUOTES = [
  'Deep work is the superpower of the 21st century.',
  'Focus on being productive instead of busy.',
  'The secret of getting ahead is getting started.',
]

export default function FocusFullscreenOverlay() {
  const {
    isFullscreen,
    setIsFullscreen,
    mode,
    timeLeft,
    progress,
    isRunning,
    ambientMode,
    getModeLabel,
    start,
    pause,
    restart,
  } = useFocusTimerContext()

  const quote = QUOTES[new Date().getDate() % QUOTES.length]
  const circumference = 2 * Math.PI * 120
  const strokeOffset = circumference - (circumference * progress) / 100

  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e) => {
      if (e.code === 'Escape') setIsFullscreen(false)
      if (e.code === 'Space') {
        e.preventDefault()
        isRunning ? pause() : start()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFullscreen, isRunning, start, pause, setIsFullscreen])

  if (!isFullscreen) return null

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background',
        ambientMode && 'bg-black'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="hero-glow" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-6 top-6"
        onClick={() => setIsFullscreen(false)}
      >
        <Minimize2 className="h-5 w-5" />
      </Button>

      <Badge variant="outline" className="mb-6">
        {getModeLabel(mode)}
      </Badge>

      <div className="relative mb-8 flex h-72 w-72 items-center justify-center">
        <svg className="h-72 w-72 -rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="120" className="stroke-muted" strokeWidth="6" fill="transparent" />
          <circle
            cx="130"
            cy="130"
            r="120"
            className="stroke-primary transition-all duration-1000 ease-linear"
            strokeWidth="6"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-mono text-7xl font-extralight tracking-tighter">
            {formatDuration(timeLeft)}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{quote}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button size="lg" onClick={isRunning ? pause : start}>
          {isRunning ? <Pause /> : <Play />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button variant="outline" size="lg" onClick={restart}>
          <RotateCcw />
          Restart
        </Button>
      </div>
    </motion.div>
  )
}
