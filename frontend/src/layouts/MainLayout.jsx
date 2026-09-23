import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FocusTimerWidget from '@/components/focus/FocusTimerWidget'
import FocusFullscreenOverlay from '@/components/focus/FocusFullscreenOverlay'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-[2px] relative overflow-x-hidden w-full max-w-full">
      <Navbar />
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-full min-w-0">
        <Outlet />
      </main>
      <FocusTimerWidget />
      <FocusFullscreenOverlay />
    </div>
  )
}
