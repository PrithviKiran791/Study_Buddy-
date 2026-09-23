import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Brain, Menu, X, Home, LogIn, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuth } from '../context/AuthContext'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/chatbot', label: 'AI Tutor' },
    { to: '/pdf-chat', label: 'PDF Chat' },
    { to: '/summarizer', label: 'Summarizer' },
    { to: '/research', label: 'Research' },
    { to: '/flashcards', label: 'Flashcards' },
    { to: '/visual-qa', label: 'Visual QA' },
    { to: '/study-planner', label: 'Study Planner' },
  ]

  return (
    <nav className="glass-nav font-google-sans">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 py-2 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5 shrink-0 -ml-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Brain className="h-7 w-7 text-foreground" />
            </motion.div>
            <span className="text-xl font-extrabold tracking-tight text-foreground font-google-sans">
              Study Assistant
            </span>
          </Link>

          <div className="hidden items-center gap-1.5 lg:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative rounded-2xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 select-none',
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="relative z-10">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tubelight-lamp"
                      className="absolute inset-0 w-full h-full bg-primary/10 border border-primary/20 rounded-2xl pointer-events-none"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                      }}
                    >
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full shadow-[0_0_8px_1px_hsl(var(--primary))]">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-6 h-4 bg-primary/40 rounded-full blur-[3px]" />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-10 h-6 bg-primary/30 rounded-full blur-md" />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-16 h-8 bg-primary/20 rounded-full blur-lg" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/25 via-primary/10 to-transparent" />
                    </motion.div>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-expanded={profileMenuOpen}
                  aria-label="User menu"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px]">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline truncate max-w-[110px] text-foreground font-medium">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", profileMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-background/95 dark:bg-zinc-950/95 border border-border/80 shadow-2xl backdrop-blur-xl p-2 z-50 overflow-hidden font-google-sans"
                    >
                      <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                        <p className="text-xs font-bold text-foreground truncate">{user.displayName || 'Study Buddy User'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-blue-400" />
                        <span>Settings & AI Memory</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <LiquidButton size="sm" className="px-4 py-2 font-bold uppercase tracking-wider text-xs">
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  <span>Sign In</span>
                </LiquidButton>
              </Link>
            )}

            <button
              className="p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/50 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          className="border-t border-border lg:hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-1.5 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors',
                  location.pathname === link.to
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {link.icon && <link.icon size={16} />}
                {link.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full mt-3 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider"
              >
                <LogIn size={16} /> Sign In
              </Link>
            ) : (
              <div className="pt-2 border-t border-border/50 mt-2 space-y-2">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-accent/50"
                >
                  <Settings size={16} className="text-blue-400" /> Settings & AI Memory
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-xs uppercase tracking-wider"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}

