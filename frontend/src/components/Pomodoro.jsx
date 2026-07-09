import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Flame, Coffee, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function Pomodoro({ timer }) {
  const [minimized, setMinimized] = useState(false)
  const { timeLeft, isRunning, mode, start, pause, reset, changeMode, adjustTime } = timer

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return "00:00"
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  // Load customized settings for relative progress calculation
  const getCustomMinutes = () => {
    const workMin = parseInt(localStorage.getItem('pomodoro_work_minutes')) || 25
    const breakMin = parseInt(localStorage.getItem('pomodoro_break_minutes')) || 5
    return { work: workMin, break: breakMin }
  }

  const customMinutes = getCustomMinutes()
  const totalSeconds = mode === 'work' ? customMinutes.work * 60 : customMinutes.break * 60
  const progress = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 100

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 glass-card bg-white/95 dark:bg-zinc-950/90 border border-zinc-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl w-52 overflow-hidden text-zinc-900 dark:text-white"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          {mode === 'work' ? (
            <>
              <Flame size={12} className="text-zinc-950 dark:text-white animate-pulse" /> Focus Session
            </>
          ) : (
            <>
              <Coffee size={12} className="text-zinc-500" /> Short Break
            </>
          )}
        </span>
        <button
          onClick={() => setMinimized(!minimized)}
          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Circular Timer Visual */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  className="stroke-zinc-100 dark:stroke-zinc-900"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  className={`transition-all duration-300 ${
                    mode === 'work'
                      ? 'stroke-black dark:stroke-white'
                      : 'stroke-zinc-400 dark:stroke-zinc-500'
                  }`}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * (progress / 100))}
                />
              </svg>
              
              <div className="absolute text-2xl font-light tracking-tighter flex flex-col items-center select-none text-zinc-950 dark:text-white">
                {/* Adjust Timer Up button (Plus 1m) */}
                {!isRunning && (
                  <button
                    onClick={() => adjustTime(60)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-0.5 -mt-3"
                    title="Add 1 minute"
                  >
                    <ChevronUp size={14} />
                  </button>
                )}
                
                <span className="font-mono font-medium leading-none">{formatTime(timeLeft)}</span>
                
                {/* Adjust Timer Down button (Minus 1m) */}
                {!isRunning && (
                  <button
                    onClick={() => adjustTime(-60)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-0.5 -mb-3 mt-0.5"
                    title="Subtract 1 minute"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => changeMode('work')}
                className={`px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${
                  mode === 'work'
                    ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                Work
              </button>
              <button
                onClick={() => changeMode('break')}
                className={`px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${
                  mode === 'break'
                    ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                Break
              </button>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={isRunning ? pause : start}
                className="flex-1 py-2 px-3 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <Pause size={12} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={12} /> Start
                  </>
                )}
              </button>
              <button
                onClick={reset}
                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-900 dark:text-white transition-colors"
                title="Reset timer"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {minimized && (
        <div className="text-center text-xl font-bold tracking-tighter text-zinc-950 dark:text-white py-1">
          {formatTime(timeLeft)}
        </div>
      )}
    </motion.div>
  )
}
