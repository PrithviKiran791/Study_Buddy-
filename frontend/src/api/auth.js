import api from './axios'

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const registerUser = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password })
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const refreshAuthToken = async () => {
  const response = await api.post('/auth/refresh')
  return response.data
}
