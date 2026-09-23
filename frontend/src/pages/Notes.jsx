import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, BookOpen, Sparkles, Download, Printer, Send } from 'lucide-react'
import api from '../api/axios'
import MarkdownViewer from '../components/MarkdownViewer'
import { toast } from '@/components/Toast'

export default function Notes() {
  const [topic, setTopic] = useState('')
  const [material, setMaterial] = useState('')
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [currentTopic, setCurrentTopic] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error('Please enter a study topic.')
      return
    }

    setLoading(true)
    setNotes('')
    try {
      const res = await api.post('/generate-notes', {
        topic,
        material,
      })
      setNotes(res.data.notes)
      setCurrentTopic(res.data.topic)
      toast.success('Study notes compiled!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to compile notes.')
    } finally {
      setLoading(false)
    }
  }

  const downloadMarkdown = () => {
    if (!notes) return
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${currentTopic.toLowerCase().replace(/\s+/g, '_')}_notes.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printNotes = () => {
    const printContent = document.getElementById('notes-content')
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Study Notes - ${currentTopic}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 28px; border-bottom: 2px solid #eaecef; padding-bottom: 8px; }
            h2 { font-size: 22px; margin-top: 24px; }
            h3 { font-size: 18px; }
            code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 85%; }
            pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th, td { border: 1px solid #dfe2e5; padding: 8px 12px; }
            th { background: #f6f8fa; }
          </style>
        </head>
        <body>
          <h1>Study Notes: ${currentTopic}</h1>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
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
        <h2 className="text-2xl font-bold tracking-tight">Study Notes Generator</h2>
        <p className="text-zinc-500 text-xs">Generate highly structured notes, bullet points, and definitions for any subject or concept</p>
      </div>

      <div className="glass-card p-6 bg-white/60 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/10 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Study Concept / Topic</label>
              <input
                type="text"
                placeholder="e.g. Photosynthesis Light Reactions, Big O Notation, Mitosis vs Meiosis..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 focus:border-black dark:focus:border-white transition-all text-xs outline-none text-zinc-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Source Material (optional)</label>
              <textarea
                placeholder="Paste reference text or source paragraphs here to help the AI tailor your notes..."
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={loading}
                className="w-full h-32 p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 focus:border-black dark:focus:border-white transition-all text-xs outline-none resize-none leading-relaxed text-zinc-950 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full btn-primary py-3 px-6 text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors shadow-md rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling Notes...
              </>
            ) : (
              <>
                Generate Notes <FileText size={13} className="ml-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* notes display */}
      {notes && !loading && (
        <motion.div
          className="glass-card p-8 border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-zinc-950/20 shadow-2xl relative space-y-6"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-zinc-900 dark:text-white w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                Study Notes: {currentTopic}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadMarkdown}
                className="px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-950 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                title="Download Markdown file"
              >
                <Download size={14} /> Export MD
              </button>
              <button
                onClick={printNotes}
                className="px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-950 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                title="Print Notes"
              >
                <Printer size={14} /> Print PDF
              </button>
            </div>
          </div>

          <div id="notes-content" className="markdown-content max-w-none">
            <MarkdownViewer content={notes} />
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="glass-card p-12 border border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-zinc-950/20 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-10 h-10 text-zinc-950 dark:text-white animate-spin" />
          <div>
            <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Compiling AI Study Guide</h4>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
              Structuring lecture summaries, indexing key topics, and drafting definitions...
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
