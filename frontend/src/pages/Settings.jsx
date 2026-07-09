import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Activity, HelpCircle, CheckCircle, Wifi, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Settings() {
  const [checking, setChecking] = useState(false)
  const [apiStatus, setApiStatus] = useState(null)
  const [workTime, setWorkTime] = useState(25)
  const [breakTime, setBreakTime] = useState(5)

  const checkConnection = async () => {
    setChecking(true)
    try {
      const response = await api.get('/health')
      if (response.data && response.data.status === 'healthy') {
        setApiStatus('online')
        toast.success('API Server connection healthy!')
      } else {
        setApiStatus('error')
        toast.error('Unexpected server response')
      }
    } catch (e) {
      setApiStatus('offline')
      toast.error('Failed to communicate with API Server')
    } finally {
      setChecking(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem('pomodoro_work_minutes', workTime)
    localStorage.setItem('pomodoro_break_minutes', breakTime)
    toast.success('Settings saved successfully!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Application Settings</h2>
        <p className="text-zinc-500 text-xs">Configure preferences and run connection diagnostics</p>
      </div>

      {/* Focus Timer configuration */}
      <div className="glass-card p-6 border border-white/10 bg-zinc-950/20 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
          <Sliders className="text-white w-5 h-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">Focus Timer Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Work Duration (Minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={workTime}
              onChange={(e) => setWorkTime(parseInt(e.target.value) || 25)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Break Duration (Minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={breakTime}
              onChange={(e) => setBreakTime(parseInt(e.target.value) || 5)}
              className="input-field"
            />
          </div>
        </div>
        <button
          onClick={saveSettings}
          className="btn-primary py-2.5 px-6 text-xs font-semibold tracking-wider uppercase mt-4"
        >
          Save Configurations
        </button>
      </div>

      {/* Diagnostics */}
      <div className="glass-card p-6 border border-white/10 bg-zinc-950/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <Activity className="text-white w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">API Server Diagnostics</h3>
          </div>
          {apiStatus && (
            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
              apiStatus === 'online' ? 'bg-white/5 text-white border border-white/10' : 'bg-zinc-900 text-zinc-400 border border-white/5'
            }`}>
              {apiStatus}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">API Endpoint URI</span>
            <span className="text-zinc-300 text-xs font-mono">http://localhost:5000/api</span>
          </div>
          <button
            onClick={checkConnection}
            disabled={checking}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Diagnostic running...
              </>
            ) : (
              <>
                <Wifi size={12} /> Test API Connection
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
