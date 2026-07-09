import { motion } from 'framer-motion'
import { User, Bot, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import MarkdownViewer from './MarkdownViewer'
import toast from 'react-hot-toast'

export default function ChatMessage({ message, isUser }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
        }`}
      >
        {isUser ? <User size={20} className="text-black" /> : <Bot size={20} className="text-white" />}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`p-4 rounded-2xl ${
            isUser ? 'bg-white border border-white text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
          } relative group`}
        >
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy message"
            >
              {copied ? <Check size={16} className="text-white" /> : <Copy size={16} />}
            </button>
          )}
          
          {isUser ? (
            <p className="whitespace-pre-wrap text-black text-sm font-medium">{message}</p>
          ) : (
            <MarkdownViewer content={message} />
          )}
        </div>
      </div>
    </motion.div>
  )
}
