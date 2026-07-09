import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownViewer from '../components/MarkdownViewer'
import { sendVisualQuestion } from '../api/chatbot'
import toast from 'react-hot-toast'

export default function VisualQA() {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setImage(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        toast.error('Please select a valid image file')
      }
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!image) {
      toast.error('Please upload an image')
      return
    }

    if (!question.trim()) {
      toast.error('Please enter a question')
      return
    }

    setLoading(true)
    try {
      const data = await sendVisualQuestion(image, question)
      setResult(data)
      toast.success('Analysis complete!')
    } catch (error) {
      const data = error.response?.data
      toast.error(data?.hint || data?.error || 'Failed to analyze image', { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImage(null)
    setImagePreview(null)
    setQuestion('')
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
          <ImageIcon className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">Visual QA</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Upload images, diagrams, charts, or equations and ask questions about them
        </p>
      </motion.div>

      {/* Input Form */}
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Upload Image
            </label>
            
            {!imagePreview ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="glass-card p-12 cursor-pointer hover:bg-white/10 transition-all text-center border-2 border-dashed border-white/20 hover:border-accent block"
                >
                  <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">Click to upload an image</p>
                  <p className="text-xs text-zinc-500">
                    Supports JPG, PNG, WEBP, GIF
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-xl glass-card p-4"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know about this image? e.g., 'Explain this diagram', 'What's in this picture?', 'Solve this equation'..."
              rows={4}
              className="textarea-field"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !image || !question.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Analyze Image
                </>
              )}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
              >
                New Question
              </button>
            )}
          </div>
        </form>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Analyzing image with AI vision..." />
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
            <h2 className="text-xl font-semibold mb-4">Question</h2>
            <p className="text-zinc-300">{result.question}</p>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">Answer</h2>
            <MarkdownViewer content={result.answer} />
          </GlassCard>

          {result.image_data && (
            <GlassCard>
              <h2 className="text-xl font-semibold mb-4">Analyzed Image</h2>
              <img
                src={result.image_data}
                alt="Analyzed"
                className="w-full max-h-96 object-contain rounded-xl"
              />
            </GlassCard>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <GlassCard>
          <div className="text-center py-12 space-y-4">
            <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No analysis yet
              </h3>
              <p className="text-zinc-500">
                Upload an image and ask a question to get started
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Examples */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-3">Example Questions:</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>What does this diagram explain?</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Solve this math equation shown in the image</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Explain the chart and its trends</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>What are the key elements in this scientific illustration?</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  )
}
