import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from '@/components/Toast'
import { lazy, Suspense } from 'react'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import FocusTimerWidget from '@/components/focus/FocusTimerWidget'
import FocusFullscreenOverlay from '@/components/focus/FocusFullscreenOverlay'
import LoadingSpinner from './components/LoadingSpinner'
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Research = lazy(() => import('./pages/Research'))
const Summarizer = lazy(() => import('./pages/Summarizer'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const PDFChat = lazy(() => import('./pages/PDFChat'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const VisualQA = lazy(() => import('./pages/VisualQA'))
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'))
const FocusCenter = lazy(() => import('./pages/FocusCenter'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  return (
    <Router>
      <ToastContainer />
      <BackgroundGradientAnimation
        containerClassName="fixed inset-0 -z-10 pointer-events-none"
        interactive={true}
      />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Chatbot />} />
              <Route path="/research" element={<Research />} />
              <Route path="/summarizer" element={<Summarizer />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/pdf-chat" element={<PDFChat />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/visual-qa" element={<VisualQA />} />
              <Route path="/study-planner" element={<StudyPlanner />} />
              <Route path="/focus-center" element={<FocusCenter />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
