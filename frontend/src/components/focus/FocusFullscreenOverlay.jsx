import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Minimize2 } from 'lucide-react'
import { useFocusTimerContext } from '@/context/FocusTimerContext'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MinimalTimer } from '@/components/ui/Counter'

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
    totalSeconds,
  } = useFocusTimerContext()

  const quote = QUOTES[new Date().getDate() % QUOTES.length]
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

      <Badge variant="outline" className="mb-8 rounded-full border-border/60 px-4 py-1 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur-md">
        {getModeLabel(mode)}
      </Badge>

      <div className="mb-10 flex flex-col items-center justify-center px-6">
        <MinimalTimer
          timeLeft={timeLeft}
          isRunning={isRunning}
          fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 76 : 124}
          fontWeight={200}
          showLabels
        />

        {/* Glass Progress Bar */}
        <div className="mt-8 w-full max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full glass-progress-track p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-accent shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <p className="mt-8 max-w-md text-center text-sm font-light italic text-muted-foreground/80 tracking-wide">
          “{quote}”
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="lg"
          className="h-12 rounded-full px-8 text-sm font-medium tracking-wide shadow-lg"
          onClick={isRunning ? pause : start}
        >
          {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isRunning ? 'Pause' : 'Start Focus'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-border/60 hover:bg-muted/30"
          onClick={restart}
          title="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
