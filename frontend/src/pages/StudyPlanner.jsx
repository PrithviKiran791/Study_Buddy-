import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Loader2, Download, Copy, Check } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownViewer from '../components/MarkdownViewer'
import { generateStudyPlan } from '../api/summarizer'
import { toast } from '@/components/Toast'
import { GenerateButton } from '@/components/ui/generate-button'

export default function StudyPlanner() {
  const [formData, setFormData] = useState({
    syllabus: '',
    topics: '',
    start_date: '',
    deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.syllabus.trim()) {
      toast.error('Please enter a syllabus or course name')
      return
    }

    setLoading(true)
    try {
      const data = await generateStudyPlan(
        formData.syllabus,
        formData.topics,
        formData.start_date,
        formData.deadline
      )
      setResult(data)
      toast.success('Study plan generated!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate study plan')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.study_plan) {
      navigator.clipboard.writeText(result.study_plan)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (result?.study_plan) {
      const blob = new Blob([result.study_plan], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study_plan_${formData.syllabus.replace(/\s+/g, '_')}.md`
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
          <Calendar className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">Study Planner</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Create personalized study plans with AI-powered scheduling and guidance
        </p>
      </motion.div>

      {/* Input Form */}
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Syllabus / Course Name *
            </label>
            <input
              type="text"
              name="syllabus"
              value={formData.syllabus}
              onChange={handleChange}
              placeholder="e.g., Data Structures and Algorithms, Biology 101..."
              className="input-field"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Topics to Cover (Optional)
            </label>
            <textarea
              name="topics"
              value={formData.topics}
              onChange={handleChange}
              placeholder="e.g., Arrays, Linked Lists, Trees, Graphs, Sorting Algorithms..."
              rows={3}
              className="textarea-field"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Deadline (Optional)
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div className="pt-2">
            <GenerateButton
              type="submit"
              disabled={loading}
              isGenerating={loading}
              hue={140}
              text="Generate Study Plan"
              generatingText="Creating Plan..."
              className="w-full"
            />
          </div>
        </form>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Creating your personalized study plan..." />
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
              <h2 className="text-xl font-semibold">Your Study Plan</h2>
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
                  Download
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Content */}
          <GlassCard>
            <MarkdownViewer content={result.study_plan} />
          </GlassCard>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <GlassCard>
          <div className="text-center py-12 space-y-4">
            <Calendar className="w-16 h-16 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No study plan yet
              </h3>
              <p className="text-zinc-500">
                Fill out the form above to create your personalized study plan
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tips */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-3">Tips for effective study plans:</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Be specific about topics you need to cover</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Set realistic deadlines that give you enough time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Include buffer time for review and practice</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Break down complex topics into smaller chunks</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  )
}
