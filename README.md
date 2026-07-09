# 🎓 AI Study Buddy

Your Personal AI Learning Assistant - Learn Smarter, Not Harder

A modern, full-stack AI-powered study platform featuring a React SPA frontend and Flask REST API backend. No authentication required - instant access to powerful AI learning tools.

## ✨ Features

### 🤖 AI-Powered Tools

1. **AI Tutor** - Conversational AI assistant for instant help
2. **PDF Chat** - Upload PDFs and chat using RAG (Retrieval Augmented Generation)
3. **Smart Summarizer** - Summarize text, articles, and web pages
4. **Research Assistant** - Generate comprehensive research reports
5. **Flashcards Generator** - Create interactive flashcards with flip animations
6. **Visual QA** - Upload images and ask questions (diagrams, charts, equations)
7. **Study Planner** - Generate personalized study schedules

### 🎨 Modern UI/UX

- **Glassmorphism Design** - Premium black & white theme
- **Smooth Animations** - Framer Motion throughout
- **Responsive** - Works on desktop, tablet, and mobile
- **Instant Access** - No login required
- **Landing Page Hub** - All features accessible from home

## 🚀 Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- React Hot Toast
- React Markdown
- Lucide React Icons

### Backend
- Flask
- Flask-CORS
- Google Gemini AI
- HuggingFace Transformers
- PyMuPDF
- FAISS (Vector Database)
- Sentence Transformers
- BeautifulSoup4

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env
echo "SECRET_KEY=your_secret_key" >> .env

# Run Flask server
python app.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔑 API Key Setup

Get your free Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## 🏗️ Project Structure

```
Study_assistant/
├── app.py                 # Flask REST API
├── rag_engine.py          # PDF RAG system
├── config.py              # Configuration
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── api/          # API services
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # Layout components
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── templates/            # Old Jinja templates (deprecated)
```

## 🎯 Usage

1. **Start the Backend**
   ```bash
   python app.py
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:5173`

4. **Start Learning!**
   - Click any feature card on the landing page
   - No login required - instant access to all tools

## 🔌 API Endpoints

### Core APIs
- `POST /api/chat` - AI Tutor conversation
- `POST /api/upload-pdf` - Upload & index PDF
- `POST /api/pdf-chat` - Chat with uploaded PDF
- `POST /api/summarize` - Summarize text/URL
- `POST /api/research` - Generate research report
- `POST /api/flashcards` - Generate flashcards
- `POST /api/visual-qa` - Visual question answering
- `POST /api/study-plan` - Generate study plan
- `GET /api/health` - Health check

## 🎨 Design System

### Colors
- **Primary**: White (#ffffff)
- **Accent**: Sky Blue (#0ea5e9)
- **Background**: Black (#000000)
- **Secondary**: Zinc grays

### Components
- Glass Cards with backdrop blur
- Rounded corners (rounded-2xl)
- Smooth transitions (300ms)
- Hover effects with glow
- Loading spinners
- Toast notifications

## 🔥 Key Features Explained

### PDF Chat (RAG)
- Upload PDF documents
- Automatic text extraction and chunking
- FAISS vector indexing
- Semantic search with embeddings
- Context-aware responses

### Smart Summarizer
- Supports plain text input
- Fetch and summarize URLs
- AI-powered bullet-point summaries
- Copy and download results

### Flashcards
- AI-generated Q&A pairs
- Interactive flip animation
- Navigation controls
- Shuffle feature
- Progress tracking

### Visual QA
- Image upload support
- Multimodal AI analysis
- Works with diagrams, charts, equations
- Detailed educational explanations

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Lint code
```

### Backend Development
```bash
# Run with auto-reload
python app.py

# The Flask server runs in debug mode by default
```

## 📱 Responsive Design

- **Mobile First** - Optimized for small screens
- **Tablet** - Adaptive layout
- **Desktop** - Full feature set
- **Touch Friendly** - Large tap targets

## 🚧 Roadmap

- [ ] Add more AI models
- [ ] Export options (PDF, DOCX)
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Progress tracking
- [ ] Spaced repetition for flashcards

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- HuggingFace for transformer models
- React team for amazing framework
- Tailwind CSS for utility-first styling
- Framer Motion for animations

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API responses for error details

---

**Made with ❤️ for learners everywhere**

Start learning smarter today with AI Study Buddy! 🚀
