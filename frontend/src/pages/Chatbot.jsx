import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Trash2, FileText, Globe, Paperclip, Calendar,
  BookOpen, Code2, Calculator, Atom, Briefcase, Brain, Sparkles,
  History, X, Clock, Settings, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import ChatMessage from '../components/ChatMessage'
import { AIThinkingIndicator } from '../components/ai'
import {
  sendChatMessage, getMemories, deleteMemory,
  getConversations, getConversation, deleteConversation
} from '../api/chatbot'
import PromptBar from '@/components/ui/PromptBar'
import JellyRadio from '@/components/ui/JellyRadio'
import { toast } from '@/components/Toast'

const CATEGORY_ITEMS = [
  { value: 'General', label: 'General', icon: <BookOpen size={12} /> },
  { value: 'Computer Science', label: 'Computer Science', icon: <Code2 size={12} /> },
  { value: 'Mathematics', label: 'Mathematics', icon: <Calculator size={12} /> },
  { value: 'Science', label: 'Science', icon: <Atom size={12} /> },
  { value: 'Interview Preparation', label: 'Interview Prep', icon: <Briefcase size={12} /> },
]

const TUTOR_SOURCES = [
  { key: 'notes', name: 'Study Notes & PDFs', description: 'Search course materials', icon: FileText, attach: true },
  { key: 'web', name: 'Web Search', description: 'Live academic resources', icon: Globe },
  { key: 'files', name: 'Photos & Files', description: 'Upload diagrams, assignments', icon: Paperclip, attach: true },
  { key: 'study', name: 'Study Schedule', description: 'Flashcards & review plans', icon: Calendar },
]

const TUTOR_COMMANDS = [
  { key: 'explain', name: '/explain', description: 'Step-by-step clear explanation' },
  { key: 'summarize', name: '/summarize', description: 'Digest key points concisely' },
  { key: 'solve', name: '/solve', description: 'Work through problem or equation' },
  { key: 'quiz', name: '/quiz', description: 'Test me with practice questions' },
  { key: 'flashcards', name: '/flashcards', description: 'Generate flashcard key terms' },
  { key: 'code', name: '/code', description: 'Write or review clean code' },
]

const TUTOR_MODELS = [
  { key: 'study-buddy', name: 'Study Buddy AI', tag: 'Fast' },
  { key: 'deep-reasoner', name: 'Deep Reasoner', tag: 'Smart' },
]

export default function Chatbot() {
  const [category, setCategory] = useState('General')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([
    {
      isUser: false,
      text: "Hello! I'm your AI Study Assistant. How can I help you learn today?",
      memoriesUsed: 0,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [memories, setMemories] = useState([])
  const [showMemoryModal, setShowMemoryModal] = useState(false)
  const [conversations, setConversations] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch active AI memories on mount
  const fetchActiveMemories = async () => {
    try {
      const data = await getMemories()
      if (data?.memories) {
        setMemories(data.memories)
      }
    } catch (err) {
      console.log('Note: Memories will activate upon sign in')
    }
  }

  // Fetch past conversation sessions on mount
  const fetchSessions = async () => {
    try {
      const data = await getConversations()
      if (data?.conversations) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.log('Note: Sessions will activate upon sign in')
    }
  }

  useEffect(() => {
    fetchActiveMemories()
    fetchSessions()
  }, [])

  const handleSend = async (text, meta = {}) => {
    const questionText = text?.trim()
    if (!questionText) return

    const fullPrompt = category && category !== 'General'
      ? `[Category: ${category}] ${questionText}`
      : questionText

    const userMessage = { isUser: true, text: questionText }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    abortControllerRef.current = new AbortController()

    try {
      const data = await sendChatMessage(fullPrompt, conversationId, history)
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }
      setHistory(data.history || [])

      // Real-time Memory feedback
      if (data.new_memories && data.new_memories.length > 0) {
        data.new_memories.forEach((m) => {
          toast.success(`🧠 Stored new AI memory: "${m.key.replace(/_/g, ' ')}" -> ${m.value}`, { duration: 5000 })
        })
      }
      if (data.all_memories) {
        setMemories(data.all_memories)
      }

      const aiMessage = {
        isUser: false,
        text: data.answer,
        memoriesUsed: data.memories_used || 0
      }
      setMessages((prev) => [...prev, aiMessage])
      fetchSessions()
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        toast.info('Response stopped')
        return
      }
      const data = error.response?.data
      toast.error(data?.hint || data?.error || 'Failed to send message', { duration: 6000 })
      setMessages((prev) =>
        prev.concat({
          isUser: false,
          text: 'Sorry, I encountered an error. Please try again.',
          memoriesUsed: 0,
        })
      )
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setLoading(false)
  }

  const handleClear = () => {
    setConversationId(null)
    setMessages([
      {
        isUser: false,
        text: "Hello! I'm your AI Study Assistant. How can I help you learn today?",
        memoriesUsed: 0,
      },
    ])
    setHistory([])
    toast.success('Started new study conversation')
  }

  const handleSelectConversation = async (convId) => {
    try {
      const data = await getConversation(convId)
      if (data?.conversation) {
        setConversationId(data.conversation.id)
        const loadedMessages = data.conversation.messages.map((m) => ({
          isUser: m.role === 'user',
          text: m.content,
          memoriesUsed: 0,
        }))
        setMessages(loadedMessages.length > 0 ? loadedMessages : [
          {
            isUser: false,
            text: "Hello! I'm your AI Study Assistant. How can I help you learn today?",
            memoriesUsed: 0,
          },
        ])
        setShowHistoryModal(false)
        toast.success(`Loaded "${data.conversation.title}"`)
      }
    } catch (err) {
      toast.error('Failed to load conversation')
    }
  }

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation()
    try {
      await deleteConversation(convId)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (conversationId === convId) {
        handleClear()
      }
      toast.success('Conversation deleted')
    } catch (err) {
      toast.error('Failed to delete conversation')
    }
  }

  const handleDeleteMemory = async (memoryId) => {
    try {
      await deleteMemory(memoryId)
      setMemories((prev) => prev.filter((m) => m.id !== memoryId))
      toast.success('Memory deleted')
    } catch (err) {
      toast.error('Failed to delete memory')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 sm:space-y-3 px-1 sm:px-2"
      >
        <div className="flex items-center justify-center gap-2.5 sm:gap-3">
          <MessageSquare className="w-7 h-7 sm:w-10 sm:h-10 text-accent shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">AI Tutor</h1>
        </div>
        <p className="text-zinc-400 text-xs sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Get instant help with your questions - Your personal AI study companion with persistent learning memory
        </p>
      </motion.div>

      {/* Chat Container */}
      <GlassCard>
        <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-border/40 w-full min-w-0">
          <div className="flex items-center justify-between gap-2 w-full flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight">Conversation</h2>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* AI Memory Badge Button */}
              <button
                onClick={() => setShowMemoryModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all hover:scale-105"
                title="View active AI memories"
              >
                <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
                <span>AI Memory ({memories.length})</span>
              </button>

              {/* Past Sessions Button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="btn-ghost flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                title="View previous study sessions"
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Sessions</span>
              </button>

              {/* Clear Chat Button */}
              <button
                onClick={handleClear}
                className="btn-ghost flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs px-2 py-1"
                title="Start a new chat session"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
          </div>

          {/* JellyRadio Category selection - cleanly scrollable without blowout */}
          <div className="w-full max-w-full min-w-0 overflow-x-auto py-1 scrollbar-none -mx-1 px-1">
            <JellyRadio
              items={CATEGORY_ITEMS}
              value={category}
              onChange={(val) => setCategory(val)}
              size="sm"
              gap={6}
              radius={14}
              swell={0.16}
              barge={5}
              stiffness={580}
              bounce={0.25}
              ariaLabel="Study subject category"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 sm:space-y-6 max-h-[500px] overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 mb-4 w-full min-w-0">
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg.text}
              isUser={msg.isUser}
              memoriesUsed={msg.memoriesUsed}
            />
          ))}
          {loading && <AIThinkingIndicator isThinking={loading} category={category} />}
          <div ref={messagesEndRef} />
        </div>

        {/* PromptBar Component */}
        <div className="pt-2">
          <PromptBar
            placeholder={`Ask your ${category} question (e.g., 'Remember I prefer code examples in Python')...`}
            busy={loading}
            sources={TUTOR_SOURCES}
            commands={TUTOR_COMMANDS}
            models={TUTOR_MODELS}
            onSend={handleSend}
            onStop={handleStop}
            sparkColor="#b39dff"
          />
        </div>
      </GlassCard>

      {/* AI Memory Modal */}
      <AnimatePresence>
        {showMemoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col font-google-sans"
            >
              <button
                onClick={() => setShowMemoryModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">AI Learning Memory</h3>
                  <p className="text-xs text-muted-foreground">
                    {memories.length} durable {memories.length === 1 ? 'fact' : 'facts'} active across all study sessions
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground my-3 bg-muted/40 p-3 rounded-xl border border-border/40">
                Study Buddy automatically detects your learning goals, explanation preferences, and weak topics to personalize responses.
              </p>

              <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1">
                {memories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No active memories yet. Try telling the chatbot:
                    <div className="mt-2 text-xs font-mono text-blue-400 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                      "Remember that I am preparing for calculus and prefer code examples"
                    </div>
                  </div>
                ) : (
                  memories.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60 hover:border-blue-500/40 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {m.memory_type}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {m.memory_key.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{m.memory_value}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                        title="Delete memory"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                <Link
                  to="/settings"
                  onClick={() => setShowMemoryModal(false)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline font-semibold"
                >
                  <Settings size={14} /> Manage in Settings
                </Link>
                <button
                  onClick={() => setShowMemoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Sessions (History) Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col font-google-sans"
            >
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Previous Study Sessions</h3>
                  <p className="text-xs text-muted-foreground">
                    Persistent conversations saved in your study database
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 my-4 pr-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No past sessions found. Start chatting to save conversations automatically!
                  </div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                        conversationId === c.id
                          ? 'bg-primary/10 border-primary/40 text-foreground'
                          : 'bg-background border-border/60 hover:border-border hover:bg-accent/40'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={14} className="text-blue-400 shrink-0" />
                          <p className="text-sm font-semibold truncate">{c.title}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock size={12} />
                          <span>{new Date(c.updated_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDeleteConversation(e, c.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete session"
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <GlassCard>
        <h3 className="text-base sm:text-lg font-semibold mb-3">AI Memory Tips:</h3>
        <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span className="break-words">Say <code className="text-[11px] sm:text-xs text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded break-all">Remember that I prefer code examples in Python</code> to set your explanation style.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span className="break-words">Say <code className="text-[11px] sm:text-xs text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded break-all">I struggle with dynamic programming</code> to have the AI adapt breakdowns for weak topics.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span className="break-words">Say <code className="text-[11px] sm:text-xs text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded break-all">I am preparing for AWS Certified Solutions Architect</code> to set your study goal.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span>Click the <strong className="text-blue-400">AI Memory ({memories.length})</strong> badge at the top to inspect, manage, or delete stored facts at any time.</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  )
}
