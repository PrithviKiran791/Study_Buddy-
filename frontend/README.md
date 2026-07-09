# AI Study Buddy - Frontend

Modern React SPA frontend for the AI Study Buddy application.

## Features

- 🎨 **Glassmorphism Design** - Premium black & white theme with blur effects
- ⚡ **React 19** - Latest React with Vite for lightning-fast development
- 🎭 **Framer Motion** - Smooth animations and transitions
- 🎯 **React Router** - Client-side routing
- 🌐 **Axios** - API integration with interceptors
- 🎨 **Tailwind CSS** - Utility-first styling
- 📱 **Responsive** - Mobile-first design
- 🔥 **Hot Toast** - Beautiful notifications

## AI Features

1. **AI Tutor** - Conversational AI assistant
2. **PDF Chat** - RAG-powered document Q&A
3. **Smart Summarizer** - Text/URL summarization
4. **Research Assistant** - Comprehensive research reports
5. **Flashcards** - Interactive learning cards
6. **Visual QA** - Image analysis and Q&A
7. **Study Planner** - AI-generated study schedules

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Make sure the Flask backend is running on `http://localhost:5000`.

The Vite proxy is configured to forward `/api/*` requests to the backend.

## Project Structure

```
src/
├── api/              # API service files
├── components/       # Reusable components
├── layouts/          # Layout components
├── pages/            # Page components
├── utils/            # Utility functions
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **React Markdown** - Markdown rendering
- **Lucide React** - Icons

## Notes

- No authentication required - direct access to all features
- All state is client-side (no server-side sessions)
- PDF sessions are temporary (stored in backend memory)
- Designed for single-user, immediate access experience
