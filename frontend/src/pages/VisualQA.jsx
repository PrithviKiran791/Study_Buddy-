import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Loader2, Upload, X, Paperclip, Sparkles, FileText, Globe } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownViewer from '../components/MarkdownViewer'
import { sendVisualQuestion } from '../api/chatbot'
import { toast } from '@/components/Toast'
import { GenerateButton } from '@/components/ui/generate-button'
import PromptBar from '@/components/ui/PromptBar'
import { FileUpload } from '@/components/ui/file-upload'

const VQA_SOURCES = [
  { key: 'files', name: 'Photos & Diagrams', description: 'Upload visual media', icon: Paperclip, attach: true },
  { key: 'diagram', name: 'Charts & Graphs', description: 'Trend & data analysis', icon: Sparkles },
  { key: 'notes', name: 'Handwritten Notes', description: 'Equations & whiteboards', icon: FileText },
  { key: 'web', name: 'Visual Knowledge', description: 'Cross-reference knowledge base', icon: Globe },
]

const VQA_COMMANDS = [
  { key: 'explain', name: '/explain', description: 'Explain this diagram or picture in detail' },
  { key: 'solve', name: '/solve', description: 'Solve equations or problems in image' },
  { key: 'transcribe', name: '/transcribe', description: 'Transcribe text, equations, or code' },
  { key: 'critique', name: '/critique', description: 'Review, check errors, and critique' },
  { key: 'summarize', name: '/summarize', description: 'Summarize key visual takeaways' },
]

const VQA_MODELS = [
  { key: 'gemini-1.5-flash', name: 'Gemini Vision Flash', tag: 'Fast' },
  { key: 'gemini-1.5-pro', name: 'Gemini Vision Pro', tag: 'Deep' },
]

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

  const handleFileUpload = (files) => {
    if (files && files.length > 0) {
      const file = files[0]
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
    } else {
      setImage(null)
      setImagePreview(null)
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const runAnalysis = async (customQuestion) => {
    const query = (customQuestion || question || '').trim()

    if (!image) {
      toast.error('Please upload an image first')
      fileInputRef.current?.click()
      return
    }

    if (!query) {
      toast.error('Please enter a question')
      return
    }

    setLoading(true)
    try {
      const data = await sendVisualQuestion(image, query)
      setResult(data)
      toast.success('Analysis complete!')
    } catch (error) {
      const data = error.response?.data
      toast.error(data?.hint || data?.error || 'Failed to analyze image', { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    runAnalysis(question)
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
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />

            {!imagePreview ? (
              <FileUpload
                onChange={handleFileUpload}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] }}
                title="Upload Image for Analysis"
                subtitle="Drag & drop your diagram, chart, equation, or photo here or click to browse"
              />
            ) : (
              <div className="relative border-2 border-blue-500/50 rounded-2xl overflow-hidden glass-card p-4 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Question Input via PromptBar */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Your Question
            </label>
            <PromptBar
              value={question}
              onChange={setQuestion}
              placeholder="What would you like to know about this image? Type '/' for actions, '@' for sources..."
              busy={loading}
              sources={VQA_SOURCES}
              commands={VQA_COMMANDS}
              models={VQA_MODELS}
              attachments={image ? [{ name: image.name, file: image }] : []}
              onAttach={() => fileInputRef.current?.click()}
              onRemoveAttachment={handleRemoveImage}
              onSend={(text) => runAnalysis(text)}
              onStop={() => setLoading(false)}
              sparkColor="#38bdf8"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 items-center pt-2">
            <GenerateButton
              type="submit"
              disabled={loading || !image || !question.trim()}
              isGenerating={loading}
              hue={180}
              text="Analyze Image"
              generatingText="Analyzing Image..."
              className="flex-1 w-full"
            />
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
          <li
            className="flex items-start gap-2 cursor-pointer hover:text-white transition-colors group"
            onClick={() => setQuestion('What does this diagram explain?')}
          >
            <span className="text-accent group-hover:scale-125 transition-transform">•</span>
            <span>What does this diagram explain?</span>
          </li>
          <li
            className="flex items-start gap-2 cursor-pointer hover:text-white transition-colors group"
            onClick={() => setQuestion('Solve this math equation shown in the image')}
          >
            <span className="text-accent group-hover:scale-125 transition-transform">•</span>
            <span>Solve this math equation shown in the image</span>
          </li>
          <li
            className="flex items-start gap-2 cursor-pointer hover:text-white transition-colors group"
            onClick={() => setQuestion('Explain the chart and its trends')}
          >
            <span className="text-accent group-hover:scale-125 transition-transform">•</span>
            <span>Explain the chart and its trends</span>
          </li>
          <li
            className="flex items-start gap-2 cursor-pointer hover:text-white transition-colors group"
            onClick={() => setQuestion('What are the key elements in this scientific illustration?')}
          >
            <span className="text-accent group-hover:scale-125 transition-transform">•</span>
            <span>What are the key elements in this scientific illustration?</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  )
}
