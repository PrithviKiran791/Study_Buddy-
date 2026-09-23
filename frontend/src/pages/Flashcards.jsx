import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, RotateCcw, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { generateFlashcards } from '../api/flashcards'
import { toast } from '@/components/Toast'
import { GenerateButton } from '@/components/ui/generate-button'

export default function Flashcards() {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setLoading(true)
    try {
      const data = await generateFlashcards(topic, count)
      setCards(data.cards)
      setCurrentIndex(0)
      setFlipped(false)
      toast.success(`Generated ${data.cards.length} flashcards!`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate flashcards')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (cards && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setFlipped(false)
    }
  }

  const handleShuffle = () => {
    if (cards) {
      const shuffled = [...cards].sort(() => Math.random() - 0.5)
      setCards(shuffled)
      setCurrentIndex(0)
      setFlipped(false)
      toast.success('Cards shuffled!')
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setFlipped(false)
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
          <Sparkles className="w-10 h-10 text-accent" />
          <h1 className="text-4xl font-bold">Flashcards Generator</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Generate interactive flashcards for better memorization and learning
        </p>
      </motion.div>

      {/* Input Form */}
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., JavaScript Basics, Biology Terms, History Dates..."
              className="input-field"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Number of Cards: {count}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full"
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <div className="pt-2">
            <GenerateButton
              type="submit"
              disabled={loading}
              isGenerating={loading}
              hue={270}
              text="Generate Flashcards"
              generatingText="Generating Cards..."
              className="w-full"
            />
          </div>
        </form>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Creating your flashcards..." />
          </div>
        </GlassCard>
      )}

      {/* Flashcard Display */}
      {cards && cards.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Controls */}
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-zinc-400">
                Card {currentIndex + 1} of {cards.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShuffle}
                  className="btn-ghost flex items-center gap-2"
                  title="Shuffle cards"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </button>
                <button
                  onClick={handleReset}
                  className="btn-ghost flex items-center gap-2"
                  title="Reset to first card"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Flashcard */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-[400px] cursor-pointer"
                onClick={() => setFlipped(!flipped)}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front (Question) */}
                <div
                  className="absolute inset-0 glass-card p-8 flex flex-col items-center justify-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                  }}
                >
                  <div className="text-sm text-accent mb-4">Question</div>
                  <p className="text-2xl text-center">
                    {cards[currentIndex].question}
                  </p>
                  <div className="mt-8 text-sm text-zinc-500">
                    Click to reveal answer
                  </div>
                </div>

                {/* Back (Answer) */}
                <div
                  className="absolute inset-0 glass-card p-8 flex flex-col items-center justify-center bg-accent/10"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="text-sm text-accent mb-4">Answer</div>
                  <p className="text-2xl text-center">
                    {cards[currentIndex].answer}
                  </p>
                  <div className="mt-8 text-sm text-zinc-500">
                    Click to see question
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!cards && !loading && (
        <GlassCard>
          <div className="text-center py-12 space-y-4">
            <Sparkles className="w-16 h-16 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No flashcards yet
              </h3>
              <p className="text-zinc-500">
                Enter a topic above to generate flashcards
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
