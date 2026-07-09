import api from './axios'

export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/chat', { message, history })
  return response.data
}

export const sendVisualQuestion = async (image, question) => {
  const formData = new FormData()
  formData.append('image', image)
  formData.append('question', question)

  const response = await api.post('/visual-qa', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
