import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import FocusTimerWidget from '@/components/focus/FocusTimerWidget'
import FocusFullscreenOverlay from '@/components/focus/FocusFullscreenOverlay'
import LoadingSpinner from './components/LoadingSpinner'

const Research = lazy(() => import('./pages/Research'))
const Summarizer = lazy(() => import('./pages/Summarizer'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const PDFChat = lazy(() => import('./pages/PDFChat'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const VisualQA = lazy(() => import('./pages/VisualQA'))
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'))
const FocusCenter = lazy(() => import('./pages/FocusCenter'))

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'glass-card !bg-card !text-foreground !border-border',
        }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Home />
                <FocusTimerWidget />
                <FocusFullscreenOverlay />
              </>
            }
          />
          <Route element={<MainLayout />}>
            <Route path="/research" element={<Research />} />
            <Route path="/summarizer" element={<Summarizer />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/pdf-chat" element={<PDFChat />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/visual-qa" element={<VisualQA />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/focus-center" element={<FocusCenter />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
