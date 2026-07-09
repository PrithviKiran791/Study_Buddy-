import { Minus, Plus, Settings2 } from 'lucide-react'
import { useFocusTimerContext } from '@/context/FocusTimerContext'
import { TIMER_PRESETS } from '@/hooks/useFocusTimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function FocusTimerCustomizer({ compact = false, className }) {
  const {
    mode,
    isRunning,
    settings,
    getModeLabel,
    getCurrentModeMinutes,
    setModeDuration,
    adjustTimeRemaining,
    applyPreset,
    updateSettings,
  } = useFocusTimerContext()

  const minutes = getCurrentModeMinutes()

  const handleMinutesInput = (value) => {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed)) setModeDuration(mode, parsed)
  }

  const activePreset = Object.entries(TIMER_PRESETS).find(([, preset]) =>
    preset.focusDuration === settings.focusDuration &&
    preset.shortBreakDuration === settings.shortBreakDuration &&
    preset.longBreakDuration === settings.longBreakDuration
  )?.[0]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick presets */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Quick Presets
        </Label>
        <div className={cn('flex flex-wrap gap-2', compact && 'gap-1')}>
          {Object.entries(TIMER_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              type="button"
              variant={activePreset === key ? 'default' : 'outline'}
              size={compact ? 'sm' : 'default'}
              disabled={isRunning}
              onClick={() => applyPreset(key)}
              className={cn(compact && 'h-7 px-2 text-[9px]')}
              title={isRunning ? 'Pause timer to change preset' : preset.description}
            >
              {preset.label}
              {!compact && (
                <span className="ml-1 text-muted-foreground">({preset.description})</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Current mode duration */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {getModeLabel(mode)} Duration
        </Label>
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={isRunning}
            onClick={() => adjustTimeRemaining(-5)}
            title="Subtract 5 minutes"
          >
            <span className="text-xs font-bold">−5</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isRunning}
            onClick={() => adjustTimeRemaining(-1)}
            title="Subtract 1 minute"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={180}
              value={minutes}
              disabled={isRunning}
              onChange={(e) => handleMinutesInput(e.target.value)}
              className={cn(
                'h-10 w-16 text-center font-mono text-lg tabular-nums',
                compact && 'h-9 w-14 text-base'
              )}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              min
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isRunning}
            onClick={() => adjustTimeRemaining(1)}
            title="Add 1 minute"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={isRunning}
            onClick={() => adjustTimeRemaining(5)}
            title="Add 5 minutes"
          >
            <span className="text-xs font-bold">+5</span>
          </Button>
        </div>
        {isRunning && (
          <p className="text-center text-[10px] text-muted-foreground">
            Pause the timer to adjust duration
          </p>
        )}
      </div>

      {/* All durations — expanded view only */}
      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { mode: 'focus', key: 'focusDuration', label: 'Focus' },
            { mode: 'shortBreak', key: 'shortBreakDuration', label: 'Short Break' },
            { mode: 'longBreak', key: 'longBreakDuration', label: 'Long Break' },
            { mode: 'custom', key: 'customDuration', label: 'Custom' },
          ].map(({ mode: m, key, label }) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={180}
                  value={settings[key]}
                  disabled={isRunning}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!Number.isNaN(v)) setModeDuration(m, v)
                  }}
                  className="h-8 w-14 text-center text-sm"
                />
                <span className="text-[10px] text-muted-foreground">m</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Sessions until long break</span>
            <Input
              type="number"
              min={1}
              max={12}
              value={settings.sessionsUntilLongBreak}
              disabled={isRunning}
              onChange={(e) =>
                updateSettings({ sessionsUntilLongBreak: parseInt(e.target.value, 10) || 1 })
              }
              className="h-8 w-14 text-center text-sm"
            />
          </div>
        </div>
      )}

      {compact && (
        <p className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
          <Settings2 className="h-3 w-3" />
          F / S / L / C — set each mode in Focus Center
        </p>
      )}
    </div>
  )
}
