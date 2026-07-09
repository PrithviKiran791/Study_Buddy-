import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, FileText, CheckCircle2, Loader2, ArrowRight, Upload } from 'lucide-react'
import { uploadPDF } from '../api/pdf'
import toast from 'react-hot-toast'

export default function UploadArea({ onSuccess }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, uploading, embedding, success, error
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
  }

  const validateAndProcessFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      toast.error('Only PDF documents are supported.')
      return
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds the 50MB limit.')
      return
    }
    setFile(selectedFile)
    setStatus('idle')
  }

  const triggerUpload = async () => {
    if (!file) return

    setStatus('uploading')
    setProgress(30)
    
    try {
      // Simulate network request chunking progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      const result = await uploadPDF(file, 'index')
      
      clearInterval(progressInterval)
      setProgress(100)
      
      // Briefly show embedding phase
      setStatus('embedding')
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setStatus('success')
      toast.success('Document indexed successfully!')
      
      if (onSuccess && result.session_id) {
        setTimeout(() => {
          onSuccess(result.session_id, file.name)
        }, 1000)
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all relative ${
          dragActive
            ? 'border-white bg-white/5'
            : 'border-white/10 hover:border-white/20 bg-zinc-950/20'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={status !== 'idle' && status !== 'error'}
        />

        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
            {file ? (
              <FileText className="w-6 h-6 text-white" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              {file ? file.name : 'Drag & drop textbook PDF'}
            </h4>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
              {file
                ? `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : 'Supports PDF textbook files up to 50MB'}
            </p>
          </div>
          {!file && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
            >
              Browse Files
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {file && status === 'idle' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={triggerUpload}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase"
          >
            Process Document 🚀
          </motion.button>
        )}

        {(status === 'uploading' || status === 'embedding') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-card p-6 border border-white/5 bg-zinc-950/20 space-y-4 text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {status === 'uploading' ? 'Uploading PDF...' : 'Generating Vector Embeddings...'}
              </span>
            </div>
            
            {status === 'uploading' ? (
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ) : (
              <p className="text-zinc-500 text-xs font-light max-w-xs mx-auto leading-relaxed">
                Splitting textbook pages into text chunks and compiling similarity mapping coordinates inside the FAISS index...
              </p>
            )}
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 border border-white/10 bg-white/[0.02] text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Indexing Completed!</h4>
              <p className="text-zinc-400 text-xs mt-1">Ready for conversational retrieval chat</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
