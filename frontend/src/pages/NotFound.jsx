import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="text-9xl font-bold bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
            404
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-zinc-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary flex items-center gap-2 justify-center">
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <Link to="/chatbot" className="btn-secondary flex items-center gap-2 justify-center">
            <Search className="w-5 h-5" />
            Ask AI
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
