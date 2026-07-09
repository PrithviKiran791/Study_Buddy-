import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { FocusTimerProvider } from './context/FocusTimerContext'
import { TooltipProvider } from '@/components/ui/tooltip'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <FocusTimerProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </FocusTimerProvider>
    </ThemeProvider>
  </React.StrictMode>
)
