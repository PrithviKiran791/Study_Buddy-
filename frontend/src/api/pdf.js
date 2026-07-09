import api from './axios'

export const uploadPDF = async (file, action = 'index') => {
  const formData = new FormData()
  formData.append('pdf_file', file)
  formData.append('action', action)

  const response = await api.post('/upload-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const chatWithPDF = async (sessionId, question) => {
  const response = await api.post('/pdf-chat', {
    session_id: sessionId,
    question,
  })
  return response.data
}
