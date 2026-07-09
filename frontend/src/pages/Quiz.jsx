import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Loader2, Sparkles, Send, CheckCircle2, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Quiz() {
  const [paragraph, setParagraph] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState({})
  const [gradedQuestions, setGradedQuestions] = useState({})

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!paragraph.trim()) {
      toast.error('Please enter study notes or a paragraph.')
      return
    }

    setLoading(true)
    setQuestions([])
    setUserAnswers({})
    setGradedQuestions({})
    try {
      const res = await api.post('/generate-questions', { paragraph })
      setQuestions(res.data.questions)
      toast.success(`Generated ${res.data.questions.length} questions!`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate quiz questions.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (idx, val) => {
    setUserAnswers((prev) => ({ ...prev, [idx]: val }))
  }

  const toggleGrade = (idx) => {
    setGradedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto text-zinc-900 dark:text-white"
    >
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold tracking-tight">AI Quiz Generator</h2>
        <p className="text-zinc-500 text-xs">Generate custom exam questions and revision tests directly from your study paragraphs</p>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 bg-white/60 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/10 shadow-xl">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Study Material / Text Notes</label>
            <textarea
              placeholder="Paste study paragraphs, summaries, or book pages here to generate a custom quiz..."
              value={paragraph}
              onChange={(e) => setParagraph(e.target.value)}
              disabled={loading}
              className="w-full h-40 p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 focus:border-black dark:focus:border-white transition-all text-xs outline-none resize-none leading-relaxed text-zinc-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !paragraph.trim()}
            className="w-full btn-primary py-3 px-6 text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors shadow-md rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling Questions...
              </>
            ) : (
              <>
                Generate Revision Quiz <HelpCircle size={13} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Questions list display */}
      {questions.length > 0 && !loading && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-8 mb-4">Quiz Questions ({questions.length})</h3>
          <div className="space-y-4">
            {questions.map((question, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="glass-card p-6 bg-white/60 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/10 space-y-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white leading-relaxed pt-0.5">{question}</p>
                </div>

                <div className="pl-9 space-y-3">
                  <textarea
                    placeholder="Draft your answer here to review..."
                    value={userAnswers[idx] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="w-full h-20 p-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 focus:border-black dark:focus:border-white transition-all text-xs outline-none resize-none text-zinc-950 dark:text-white"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleGrade(idx)}
                      className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold"
                    >
                      {gradedQuestions[idx] ? 'Hide explanation' : 'Mark Completed'}
                    </button>
                    {gradedQuestions[idx] && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-900 dark:text-white font-bold">
                        <CheckCircle2 size={12} /> Practice Complete
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {gradedQuestions[idx] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 p-4 rounded-xl bg-black/[0.015] dark:bg-white/[0.015] border border-zinc-200 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed"
                      >
                        <strong className="text-zinc-950 dark:text-white block mb-1">Your Draft Answer:</strong>
                        {userAnswers[idx] ? userAnswers[idx] : <span className="italic">No answer drafted.</span>}
                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                          Tip: Copy this question into the AI Chat page for comprehensive grading and tutor advice.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="glass-card p-12 border border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-zinc-950/20 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-10 h-10 text-zinc-950 dark:text-white animate-spin" />
          <div>
            <h4 className="font-bold text-sm text-zinc-950 dark:text-white">AI Question Compiler Active</h4>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
              Scaffolding contextual paragraphs, identifying target concepts, and generating exam challenges...
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
