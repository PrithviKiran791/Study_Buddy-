import api from './axios'

export const researchTopic = async (topic) => {
  const response = await api.post('/research', { topic })
  return response.data
}
