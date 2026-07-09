import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = false, ...props }) {
  const baseClasses = hover ? 'glass-card-hover' : 'glass-card'
  
  return (
    <motion.div
      className={`${baseClasses} p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
