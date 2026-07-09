import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Clock,
  ArrowRight,
  Flame,
  BarChart3,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'

/* ------------------------------------------------------------------ */
/*  Data layer fallback setup                                          */
/* ------------------------------------------------------------------ */

async function fetchOrFallback(endpoint, fallback) {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error('bad response')
    return await res.json()
  } catch {
    return fallback
  }
}

const QUOTES = [
  "Small daily gains compound into mastery.",
  "You don't have to be great to start, but you have to study to be great.",
  "Focus on progress, not perfection.",
  "Every flashcard reviewed is a future exam question answered.",
  "Consistency beats intensity.",
]

function greetingForHour(hour) {
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function useDashboardData(username) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const now = new Date()
      const fallback = {
        streak: 18,
        longestStreak: 26,
        goalHours: 4,
        completedHoursBase: 2.6,
        weeklyTrend: [
          { day: 'Mon', hours: 2.1 },
          { day: 'Tue', hours: 3.4 },
          { day: 'Wed', hours: 1.8 },
          { day: 'Thu', hours: 2.9 },
          { day: 'Fri', hours: 3.6 },
          { day: 'Sat', hours: 2.4 },
          { day: 'Sun', hours: 2.2 },
        ],
        activeHours: [
          { hour: '6-9a', minutes: 20 },
          { hour: '9-12p', minutes: 65 },
          { hour: '12-3p', minutes: 40 },
          { hour: '3-6p', minutes: 55 },
          { hour: '6-9p', minutes: 95 },
          { hour: '9-12a', minutes: 70 },
        ],
        quote: QUOTES[now.getDate() % QUOTES.length],
      }

      const summary = await fetchOrFallback('/api/dashboard/summary', fallback)
      if (!cancelled) {
        setData(summary)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [username])

  return { data, loading }
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-black/5 dark:bg-white/[0.04] ${className}`} />
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
      {Icon && <Icon size={12} className="text-zinc-500" />}
      {children}
    </h3>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { data, loading } = useDashboardData(user?.username)

  const hour = new Date().getHours()
  const greeting = greetingForHour(hour)

  const chartColor = isDark ? '#ffffff' : '#09090b'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-72" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 text-zinc-900 dark:text-white"
    >
      {/* 1. Welcome Header ------------------------------------------------ */}
      <div className="p-8 rounded-2xl bg-black/[0.02] dark:bg-white/[0.01] border border-black/10 dark:border-white/[0.08] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-[30%] h-full bg-black/[0.01] dark:bg-white/[0.01] blur-[80px] pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white">
              {greeting}, {user?.username || 'Student'}
            </h2>
            <p className="text-zinc-500 text-xs font-light italic max-w-md">"{data.quote}"</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-zinc-900 dark:text-white" />
              <div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white leading-none">{data.streak} Days</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Current Streak</div>
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />
            <div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white leading-none">
                {data.completedHoursBase}h <span className="text-zinc-500 font-normal">/ {data.goalHours}h</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Today's Goal</div>
            </div>
            <Link
              to="/chatbot"
              className="px-5 py-3 rounded-xl bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-bold text-xs uppercase tracking-wider dark:hover:bg-zinc-200 transition-all duration-300 shadow-md flex items-center justify-center gap-2"
            >
              Start AI Chat <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Charts Grid ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Productivity Trend */}
        <div className="glass-card p-6 bg-white/60 dark:bg-zinc-950/20">
          <SectionLabel icon={BarChart3}>Weekly Productivity Trend</SectionLabel>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${gridColor}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: isDark ? '#a1a1aa' : '#52525b' }}
                />
                <Area type="monotone" dataKey="hours" stroke={chartColor} strokeWidth={2} fill="url(#trendFill)" animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Focus Intervals */}
        <div className="glass-card p-6 bg-white/60 dark:bg-zinc-950/20">
          <SectionLabel icon={Clock}>Hourly Focus Intervals</SectionLabel>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activeHours}>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${gridColor}`, borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="minutes" fill={chartColor} fillOpacity={0.7} radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
