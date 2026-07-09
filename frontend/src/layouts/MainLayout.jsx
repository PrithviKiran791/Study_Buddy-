import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FocusTimerWidget from '@/components/focus/FocusTimerWidget'
import FocusFullscreenOverlay from '@/components/focus/FocusFullscreenOverlay'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <FocusTimerWidget />
      <FocusFullscreenOverlay />
    </div>
  )
}
