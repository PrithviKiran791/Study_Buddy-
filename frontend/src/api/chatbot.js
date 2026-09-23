import api from './axios'

export const sendChatMessage = async (message, conversation_id = null, history = []) => {
  const response = await api.post('/chat', { message, conversation_id, history })
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

export const getMemories = async () => {
  const response = await api.get('/memory')
  return response.data
}

export const deleteMemory = async (memoryId) => {
  const response = await api.delete(`/memory/${memoryId}`)
  return response.data
}

export const getConversations = async () => {
  const response = await api.get('/conversations')
  return response.data
}

export const getConversation = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}`)
  return response.data
}

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/conversations/${conversationId}`)
  return response.data
}
