import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  RefreshCw,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { useFocusTimerContext } from '@/context/FocusTimerContext'
import { formatDuration, formatHours } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FocusTimerCustomizer from '@/components/focus/FocusTimerCustomizer'
import { cn } from '@/lib/utils'

const QUOTES = [
  'Deep work is the superpower of the 21st century.',
  'Focus on being productive instead of busy.',
  'The secret of getting ahead is getting started.',
  'Small daily improvements lead to stunning results.',
  'Discipline is choosing between what you want now and what you want most.',
]

export default function FocusCenter() {
  const timer = useFocusTimerContext()
  const {
    mode,
    timeLeft,
    progress,
    isRunning,
    stats,
    history,
    tasks,
    settings,
    upcomingMode,
    ambientMode,
    getModeLabel,
    updateSettings,
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
  } = timer

  const quote = QUOTES[new Date().getDate() % QUOTES.length]
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        isRunning ? pause() : start()
      }
      if (e.code === 'KeyR') restart()
      if (e.code === 'KeyS') skip()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, start, pause, restart, skip])

  const statItems = [
    { label: "Today's Focus", value: formatHours(stats.todayFocusTime || 0) },
    { label: 'Weekly Focus', value: formatHours(stats.weeklyFocusTime || 0) },
    { label: 'Sessions', value: stats.completedSessions || 0 },
    { label: 'Longest Session', value: formatDuration(stats.longestSession || 0) },
    { label: 'Current Streak', value: `${stats.currentStreak || 0} days` },
    { label: 'Avg Focus', value: formatDuration(stats.averageFocusTime || 0) },
    { label: 'Break Time', value: formatHours(stats.breakTime || 0) },
    { label: 'Total Study', value: formatHours(stats.totalStudyTime || 0) },
  ]

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="muted" className="mb-3">
            Productivity
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Focus Center</h1>
          <p className="mt-2 text-muted-foreground">
            Deep work sessions with minimal distractions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAmbientMode(!ambientMode)}>
            <Sparkles className="h-4 w-4" />
            Ambient {ambientMode ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{getModeLabel(mode)} Session</span>
              <Badge variant="outline">Next: {getModeLabel(upcomingMode)}</Badge>
            </CardTitle>
            <CardDescription>
              {stats.dailySessions || 0} sessions completed today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto mb-8 flex h-56 w-56 items-center justify-center">
              <svg className="h-56 w-56 -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" className="stroke-muted" strokeWidth="5" fill="transparent" />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  className="stroke-primary transition-all duration-1000 ease-linear"
                  strokeWidth="5"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 - (2 * Math.PI * 90 * progress) / 100}
                />
              </svg>
              <div className="absolute text-center">
                <div className="font-mono text-5xl font-extralight tracking-tighter">
                  {formatDuration(timeLeft)}
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {['focus', 'shortBreak', 'longBreak', 'custom'].map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchMode(m)}
                >
                  {getModeLabel(m)}
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {m === 'focus' && `${settings.focusDuration}m`}
                    {m === 'shortBreak' && `${settings.shortBreakDuration}m`}
                    {m === 'longBreak' && `${settings.longBreakDuration}m`}
                    {m === 'custom' && `${settings.customDuration}m`}
                  </span>
                </Button>
              ))}
            </div>

            <div className="mb-8 rounded-xl border border-border bg-muted/30 p-4">
              <FocusTimerCustomizer />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={isRunning ? pause : start}>
                {isRunning ? <Pause /> : <Play />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button variant="outline" onClick={restart}>
                <RotateCcw />
                Restart
              </Button>
              <Button variant="outline" onClick={skip}>
                <SkipForward />
                Skip
              </Button>
              <Button variant="outline" onClick={reset}>
                <RefreshCw />
                Reset
              </Button>
            </div>

            <p className="mt-6 text-center text-sm italic text-muted-foreground">"{quote}"</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>What are you focusing on?</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.target.elements.task
                addTask(input.value)
                input.value = ''
              }}
              className="mb-4 flex gap-2"
            >
              <Input name="task" placeholder="Add a task..." className="flex-1" />
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                )}
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <button onClick={() => toggleTask(task.id)}>
                      <CheckCircle2
                        className={cn(
                          'h-4 w-4',
                          task.done ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        task.done && 'text-muted-foreground line-through'
                      )}
                    >
                      {task.text}
                    </span>
                    <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statItems.map((item) => (
              <Card key={item.label} className="glass-card">
                <CardContent className="p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="glass-card">
            <CardContent className="p-6">
              <ScrollArea className="h-64">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{entry.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.completedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{formatDuration(entry.duration)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Timer Preferences</CardTitle>
              <CardDescription>Fine-tune durations, presets, and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FocusTimerCustomizer />

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: 'autoStartBreak', label: 'Auto Start Break' },
                  { key: 'autoStartFocus', label: 'Auto Start Focus' },
                  { key: 'notificationSounds', label: 'Notification Sounds' },
                  { key: 'desktopNotifications', label: 'Desktop Notifications' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      checked={settings[key]}
                      onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                    />
                  </div>
                ))}

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="volume">Volume ({Math.round(settings.volume * 100)}%)</Label>
                  <input
                    id="volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={settings.volume}
                    onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
