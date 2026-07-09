import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Brain, Menu, X, Home, Timer } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/research', label: 'Research' },
    { to: '/summarizer', label: 'Summarizer' },
    { to: '/flashcards', label: 'Flashcards' },
    { to: '/pdf-chat', label: 'PDF Chat' },
    { to: '/chatbot', label: 'AI Tutor' },
    { to: '/visual-qa', label: 'Visual QA' },
    { to: '/study-planner', label: 'Study Planner' },
  ]

  return (
    <nav className="glass-nav">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Brain className="h-7 w-7 text-foreground" />
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              AI Study Buddy
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-widest transition-all duration-200',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/focus-center">
                <Timer className="h-3.5 w-3.5" />
                Focus
              </Link>
            </Button>
            <ThemeToggle />

            <button
              className="p-2 text-muted-foreground hover:text-foreground lg:hidden"
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
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                  location.pathname === link.to
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {link.icon && <link.icon size={16} />}
                {link.label}
              </Link>
            ))}
            <Link
              to="/focus-center"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Timer size={16} />
              Focus Center
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
