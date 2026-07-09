import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { registerUser } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const password = watch('password')

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const response = await registerUser(data.username, data.email, data.password)
      localStorage.setItem('token', response.token)
      login(response.user)
      toast.success(`Welcome to Study Buddy, ${response.user.username}!`)
      navigate('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center px-4 font-sans select-none overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-white/[0.01] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-zinc-800/[0.02] blur-[120px] pointer-events-none" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white mb-4">
            <Brain className="w-7 h-7" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
          <p className="text-zinc-500 text-xs mt-1 font-light">Get started with our AI study tools today</p>
        </div>

        {/* Register Card */}
        <div className="glass-card p-8 border border-white/[0.08] bg-zinc-950/40 shadow-2xl relative">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="johndoe"
                  className={`input-field pl-12 ${errors.username ? 'border-white/20' : ''}`}
                  {...register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' }
                  })}
                />
              </div>
              {errors.username && (
                <span className="text-zinc-400 text-xs mt-1 block">{errors.username.message}</span>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`input-field pl-12 ${errors.email ? 'border-white/20' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z0-9.-]+$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <span className="text-zinc-400 text-xs mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input-field pl-12 ${errors.password ? 'border-white/20' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
              </div>
              {errors.password && (
                <span className="text-zinc-400 text-xs mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input-field pl-12 ${errors.confirmPassword ? 'border-white/20' : ''}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-zinc-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3.5 mt-2 flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" /> Registering...
                </>
              ) : (
                <>
                  Register <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-bold">
              Log in instead
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
