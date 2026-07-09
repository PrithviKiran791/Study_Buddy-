import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Copy, Check, Link as LinkIcon } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownViewer from '../components/MarkdownViewer'
import { summarizeText } from '../api/summarizer'
import toast from 'react-hot-toast'

export default function Summarizer() {
  const [inputType, setInputType] = useState('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (inputType === 'text' && !text.trim()) {
      toast.error('Please enter some text')
      return
    }
    if (inputType === 'url' && !url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setLoading(true)
    try {
      const data = await summarizeText(
        inputType === 'text' ? text : '',
        inputType === 'url' ? url : ''
      )
      setResult(data)
      toast.success('Summarization complete!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to summarize')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.summary) {
      navigator.clipboard.writeText(result.summary)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <FileText className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">Smart Summarizer</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Summarize text, articles, and web pages instantly with AI
        </p>
      </motion.div>

      {/* Input Form */}
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Type Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputType('text')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                inputType === 'text'
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Text
            </button>
            <button
              type="button"
              onClick={() => setInputType('url')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                inputType === 'url'
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              URL
            </button>
          </div>

          {/* Input Fields */}
          {inputType === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Enter Text to Summarize
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                rows={10}
                className="textarea-field"
                disabled={loading}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Enter URL to Summarize
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="input-field"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Summarize
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Analyzing and summarizing content..." />
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Summary</h2>
              <button
                onClick={handleCopy}
                className="btn-ghost flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <MarkdownViewer content={result.summary} />
          </GlassCard>

          {result.input_preview && (
            <GlassCard>
              <h3 className="text-lg font-semibold mb-2">Original Content Preview</h3>
              <p className="text-zinc-400 text-sm">{result.input_preview}</p>
            </GlassCard>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <GlassCard>
          <div className="text-center py-12 space-y-4">
            <FileText className="w-16 h-16 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No summary yet
              </h3>
              <p className="text-zinc-500">
                Enter text or a URL above to get started
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
