import api from './axios'

export const summarizeText = async (text, url) => {
  const response = await api.post('/summarize', { text, url })
  return response.data
}

export const generateQuestions = async (paragraph) => {
  const response = await api.post('/generate-questions', { paragraph })
  return response.data
}

export const answerQuestion = async (context, question, history = []) => {
  const response = await api.post('/answer-question', { context, question, history })
  return response.data
}

export const webSearch = async (question) => {
  const response = await api.post('/web-search', { question })
  return response.data
}

export const generateStudyPlan = async (syllabus, topics, start_date, deadline) => {
  const response = await api.post('/study-plan', { syllabus, topics, start_date, deadline })
  return response.data
}
