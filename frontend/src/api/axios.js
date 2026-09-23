import axios from 'axios'
import { auth } from '../config/firebase'
import { toast } from '@/components/Toast'

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!envUrl) return '/api'
  const trimmed = envUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (err) {
      console.error('[AXIOS] Failed to fetch Firebase ID token:', err)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        // Unauthorized
        console.warn('[AXIOS] 401 Unauthorized')
      } else if (status === 404) {
        toast.error('Resource not found')
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.')
      } else if (data?.error) {
        toast.error(data.error)
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

export default api
