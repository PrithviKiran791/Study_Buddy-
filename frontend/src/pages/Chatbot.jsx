import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import ChatMessage from '../components/ChatMessage'
import TypingIndicator from '../components/TypingIndicator'
import { sendChatMessage } from '../api/chatbot'
import toast from 'react-hot-toast'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      isUser: false,
      text: "Hello! I'm your AI Study Assistant. How can I help you learn today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { isUser: true, text: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const data = await sendChatMessage(input, history)
      setHistory(data.history)
      const aiMessage = { isUser: false, text: data.answer }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const data = error.response?.data
      toast.error(data?.hint || data?.error || 'Failed to send message', { duration: 6000 })
      setMessages((prev) =>
        prev.concat({
          isUser: false,
          text: 'Sorry, I encountered an error. Please try again.',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        isUser: false,
        text: "Hello! I'm your AI Study Assistant. How can I help you learn today?",
      },
    ])
    setHistory([])
    toast.success('Chat cleared')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <MessageSquare className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">AI Tutor</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Get instant help with your questions - Your personal AI study companion
        </p>
      </motion.div>

      {/* Chat Container */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Conversation</h2>
          <button
            onClick={handleClear}
            className="btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 mb-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </GlassCard>

      {/* Tips */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-3">Tips for better responses:</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Be specific with your questions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Ask for explanations with examples</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Request step-by-step breakdowns for complex topics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Follow up with clarifying questions</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  )
}
