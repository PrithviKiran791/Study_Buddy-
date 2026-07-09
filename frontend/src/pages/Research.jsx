import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2, Download, Copy, Check } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownViewer from '../components/MarkdownViewer'
import { researchTopic } from '../api/research'
import toast from 'react-hot-toast'

export default function Research() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setLoading(true)
    try {
      const data = await researchTopic(topic)
      setResult(data)
      toast.success('Research completed!')
    } catch (error) {
      const data = error.response?.data
      toast.error(data?.hint || data?.error || 'Failed to generate research', { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (result?.content) {
      const blob = new Blob([result.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.topic.replace(/\s+/g, '_')}_research.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded successfully')
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
          <Search className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">Research Assistant</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Generate comprehensive research reports on any topic with AI-powered insights
        </p>
      </motion.div>

      {/* Input Form */}
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Research Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning Fundamentals, Climate Change, Quantum Physics..."
              className="input-field"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Generate Research
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Generating comprehensive research report..." />
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
          {/* Actions */}
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Research: {result.topic}</h2>
              <div className="flex gap-2">
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
                <button
                  onClick={handleDownload}
                  className="btn-ghost flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download MD
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Content */}
          <GlassCard>
            <MarkdownViewer content={result.content} />
          </GlassCard>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <GlassCard>
          <div className="text-center py-12 space-y-4">
            <Search className="w-16 h-16 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No research yet
              </h3>
              <p className="text-zinc-500">
                Enter a topic above to generate a comprehensive research report
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
