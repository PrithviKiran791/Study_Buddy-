import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { FocusTimerProvider } from './context/FocusTimerContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <FocusTimerProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </FocusTimerProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
