import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Layers,
  FileText,
  MessageSquare,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/research', label: 'Research', icon: Search },
    { to: '/summarizer', label: 'Summarizer', icon: BookOpen },
    { to: '/flashcards', label: 'Flashcards', icon: Layers },
    { to: '/pdf-chat', label: 'PDF Chat', icon: FileText },
    { to: '/chatbot', label: 'AI Chat', icon: MessageSquare },
  ]

  const bottomItems = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <motion.div
      className={`hidden md:flex flex-col h-screen fixed left-0 top-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/5 z-30`}
      animate={{ width: collapsed ? '80px' : '260px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-zinc-200 dark:border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10"
          >
            <Brain className="w-6 h-6 text-black dark:text-white" />
          </motion.div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold text-black dark:text-white font-sans tracking-tight"
            >
              Study Assistant
            </motion.span>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to}>
              <motion.div
                className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer relative group transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'text-zinc-500 hover:text-black hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-white dark:bg-black rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white dark:text-black' : 'text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white transition-colors'}`} />
                
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white dark:text-black' : 'text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white'}`}
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Collapsed State Tooltip */}
                {collapsed && (
                  <div className="absolute left-20 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-black dark:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* Bottom Profile and Controls */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/5 space-y-2">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to}>
              <motion.div
                className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer relative group transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'text-zinc-500 hover:text-black hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white dark:text-black' : 'text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white transition-colors'}`} />
                {!collapsed && (
                  <span className={`text-sm font-semibold ${isActive ? 'text-white dark:text-black' : 'text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white'}`}>{item.label}</span>
                )}
                {collapsed && (
                  <div className="absolute left-20 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-black dark:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          )
        })}

        {/* Logout Button */}
        <motion.div
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer text-zinc-500 hover:text-black hover:bg-black/5 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition-all duration-200 group relative"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white" />
          {!collapsed && (
            <span className="text-sm font-semibold">Logout</span>
          )}
          {collapsed && (
            <div className="absolute left-20 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-black dark:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Logout
            </div>
          )}
        </motion.div>
      </div>

      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-md z-40"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.div>
  )
}
