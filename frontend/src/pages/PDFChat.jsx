import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Upload, Loader2, Send, Trash2 } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ChatMessage from '../components/ChatMessage'
import TypingIndicator from '../components/TypingIndicator'
import { uploadPDF, chatWithPDF } from '../api/pdf'
import toast from 'react-hot-toast'

export default function PDFChat() {
  const [file, setFile] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      toast.error('Please select a valid PDF file')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a PDF file')
      return
    }

    setUploading(true)
    try {
      const data = await uploadPDF(file, 'index')
      setSessionId(data.session_id)
      toast.success('PDF processed successfully! You can now ask questions.')
      setMessages([
        {
          isUser: false,
          text: `PDF "${file.name}" has been uploaded and indexed. Ask me anything about the document!`,
        },
      ])
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) {
      toast.error('Please enter a question')
      return
    }

    if (!sessionId) {
      toast.error('Please upload a PDF first')
      return
    }

    const userMessage = { isUser: true, text: question }
    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setLoading(true)
    setTimeout(scrollToBottom, 100)

    try {
      const data = await chatWithPDF(sessionId, question)
      const aiMessage = { isUser: false, text: data.answer }
      setMessages((prev) => [...prev, aiMessage])
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      const data = error.response?.data
      toast.error(data?.hint || data?.error || 'Failed to get answer', { duration: 6000 })
      setMessages((prev) =>
        prev.slice(0, -1).concat({
          isUser: false,
          text: 'Sorry, I encountered an error. Please try again.',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSessionId(null)
    setMessages([])
    setQuestion('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Session reset')
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
          <FileText className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">PDF Chat</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Upload a PDF and chat with your document using RAG technology
        </p>
      </motion.div>

      {/* Upload Section */}
      {!sessionId && (
        <GlassCard>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select PDF File
              </label>
              <div className="flex gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex-1 glass-card p-6 cursor-pointer hover:bg-white/10 transition-all text-center border-2 border-dashed border-white/20 hover:border-accent"
                >
                  <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {file ? file.name : 'Click to select PDF file'}
                  </p>
                </label>
              </div>
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing PDF...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Process
                  </>
                )}
              </button>
            )}
          </div>
        </GlassCard>
      )}

      {/* Processing State */}
      {uploading && (
        <GlassCard>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Processing and indexing PDF..." />
          </div>
        </GlassCard>
      )}

      {/* Chat Interface */}
      {sessionId && !uploading && (
        <>
          {/* Chat Header */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-sm text-zinc-400">Ready to answer questions</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Reset
              </button>
            </div>
          </GlassCard>

          {/* Messages */}
          <GlassCard>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  message={msg.text}
                  isUser={msg.isUser}
                />
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </GlassCard>

          {/* Input Form */}
          <GlassCard>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the PDF..."
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </GlassCard>
        </>
      )}
    </div>
  )
}
