import React from 'react'
import { motion } from 'framer-motion'
import BorderGlow from './ui/BorderGlow'

export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = true,
  edgeSensitivity = 28,
  glowColor = '265 85 75',
  borderRadius = 16,
  ...props
}) {
  const baseClasses = hover ? 'glass-card-hover' : 'glass-card'

  if (glow) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-full min-w-0"
      >
        <BorderGlow
          edgeSensitivity={edgeSensitivity}
          glowColor={glowColor}
          borderRadius={borderRadius}
          glowRadius={36}
          className={`${baseClasses} p-4 sm:p-6 w-full max-w-full min-w-0 ${className}`}
          {...props}
        >
          {children}
        </BorderGlow>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`${baseClasses} p-4 sm:p-6 w-full max-w-full min-w-0 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
