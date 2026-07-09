import { motion } from 'framer-motion'
import { User, Mail, Calendar, ShieldCheck, Award } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
  const { user } = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Student Profile</h2>
        <p className="text-zinc-500 text-xs">Manage your account status and credentials</p>
      </div>

      <div className="glass-card p-8 border border-white/10 bg-zinc-950/20 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/5">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white text-3xl font-bold">
            {user?.username ? user.username[0].toUpperCase() : 'S'}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">{user?.username || 'Student User'}</h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-semibold uppercase tracking-wider mt-2">
              <ShieldCheck size={10} /> Active Student Account
            </span>
          </div>
        </div>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Username</span>
              <div className="flex items-center gap-2.5 text-zinc-300 text-sm py-1">
                <User size={16} className="text-zinc-500" />
                {user?.username}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email Address</span>
              <div className="flex items-center gap-2.5 text-zinc-300 text-sm py-1">
                <Mail size={16} className="text-zinc-500" />
                {user?.email}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Account Created</span>
              <div className="flex items-center gap-2.5 text-zinc-300 text-sm py-1">
                <Calendar size={16} className="text-zinc-500" />
                July 9, 2026
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Membership Level</span>
              <div className="flex items-center gap-2.5 text-zinc-300 text-sm py-1">
                <Award size={16} className="text-zinc-500" />
                Premium Scholar (Free Tier)
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
