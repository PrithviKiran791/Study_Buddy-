import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Activity, Wifi, RefreshCw, Brain, Trash2, ShieldAlert } from 'lucide-react'
import api from '../api/axios'
import { toast } from '@/components/Toast'

export default function Settings() {
  const [checking, setChecking] = useState(false)
  const [apiStatus, setApiStatus] = useState(null)
  const [workTime, setWorkTime] = useState(25)
  const [breakTime, setBreakTime] = useState(5)
  
  const [memories, setMemories] = useState([])
  const [loadingMemories, setLoadingMemories] = useState(false)

  const fetchMemories = async () => {
    setLoadingMemories(true)
    try {
      const res = await api.get('/memory')
      setMemories(res.data?.memories || [])
    } catch (err) {
      console.error('Failed to load AI memories:', err)
    } finally {
      setLoadingMemories(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [])

  const handleDeleteMemory = async (memoryId) => {
    try {
      await api.delete(`/memory/${memoryId}`)
      toast.success('Memory deleted')
      setMemories((prev) => prev.filter((m) => m.id !== memoryId))
    } catch (err) {
      toast.error('Failed to delete memory')
    }
  }

  const handleClearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all saved AI learning memories?')) return
    try {
      await api.delete('/memory')
      toast.success('All AI memories cleared')
      setMemories([])
    } catch (err) {
      toast.error('Failed to clear memories')
    }
  }

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
        <p className="text-zinc-500 text-xs">Configure preferences, AI memory, and run diagnostics</p>
      </div>

      {/* AI Memory Management */}
      <div className="glass-card p-6 border border-white/10 bg-zinc-950/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <Brain className="text-blue-400 w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">AI Learning Memory</h3>
          </div>
          {memories.length > 0 && (
            <button
              onClick={handleClearAllMemories}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Memories
            </button>
          )}
        </div>

        <p className="text-zinc-400 text-xs leading-relaxed">
          Study Buddy automatically learns your study goals, weak topics, and explanation preferences to personalize AI responses across all sessions.
        </p>

        {loadingMemories ? (
          <div className="text-zinc-500 text-xs py-4 text-center">Loading saved memories...</div>
        ) : memories.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
            No saved memories yet. As you chat, Study Buddy will automatically learn your study preferences!
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 mr-2">
                    {mem.memory_type}
                  </span>
                  <span className="font-semibold text-zinc-200 mr-2">{mem.memory_key}:</span>
                  <span className="text-zinc-400">{mem.memory_value}</span>
                </div>
                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
            <span className="text-zinc-300 text-xs font-mono break-all">{import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api` : 'http://localhost:5000/api'}</span>
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
