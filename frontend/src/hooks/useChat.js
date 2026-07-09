import { useState, useCallback } from 'react'
import { sendChatMessage, sendVisualQuestion } from '../api/chatbot'
import { chatWithPDF } from '../api/pdf'
import toast from 'react-hot-toast'

export default function useChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  const sendMessage = useCallback(async (text, isPDF = false, visualImage = null) => {
    if (!text.trim() && !visualImage) return
    
    // Add user message
    const userMsg = { text: text || "Analyzed Image", isUser: true }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      let responseText = ''
      
      if (isPDF) {
        if (!sessionId) {
          toast.error("No active PDF session. Please upload a PDF first.")
          setLoading(false)
          return
        }
        const data = await chatWithPDF(sessionId, text)
        responseText = data.answer
      } else if (visualImage) {
        const data = await sendVisualQuestion(visualImage, text)
        responseText = data.answer
      } else {
        // Map to format required by Flask chatbot backend
        // Backend history format: [{"role": "user", "parts": [message]}]
        const history = []
        for (let i = 0; i < messages.length; i += 2) {
          if (messages[i] && messages[i+1]) {
            history.push({
              role: 'user',
              parts: [messages[i].text]
            })
            history.push({
              role: 'model',
              parts: [messages[i+1].text]
            })
          }
        }
        const data = await sendChatMessage(text, history)
        responseText = data.answer
      }

      setMessages((prev) => [...prev, { text: responseText, isUser: false }])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [...prev, { text: "Error: Failed to fetch response from AI.", isUser: false }])
    } finally {
      setLoading(false)
    }
  }, [messages, sessionId])

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    loading,
    sessionId,
    setSessionId,
    sendMessage,
    clearChat,
    setMessages
  }
}
