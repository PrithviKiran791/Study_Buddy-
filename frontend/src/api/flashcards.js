import api from './axios'

export const generateFlashcards = async (topic, count = 5) => {
  const response = await api.post('/flashcards', { topic, count })
  return response.data
}
