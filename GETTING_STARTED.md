# 🚀 Getting Started with AI Study Buddy

Quick start guide to get the application running on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Study_assistant
```

## Step 2: Backend Setup

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- Flask-CORS (CORS support)
- Google Generative AI (Gemini)
- Transformers (HuggingFace)
- PyMuPDF (PDF processing)
- FAISS (vector database)
- And more...

### Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
GEMINI_API_KEY=your_actual_api_key_here
SECRET_KEY=any_random_string_here
```

### Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

### Start the Backend Server

```bash
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

The backend is now running on `http://localhost:5000`

## Step 3: Frontend Setup

Open a **new terminal** (keep the backend running) and navigate to the frontend directory:

```bash
cd frontend
```

### Install Node Dependencies

```bash
npm install
```

This will install:
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- React Router
- And more...

### Start the Development Server

```bash
npm run dev
```

You should see:
```
  VITE v6.0.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend is now running on `http://localhost:5173`

## Step 4: Open the Application

Open your web browser and navigate to:

```
http://localhost:5173
```

You should see the AI Study Buddy landing page! 🎉

## Step 5: Test the Features

Try out each feature:

1. **AI Tutor** - Click "Start Learning" or navigate to AI Tutor
2. **PDF Chat** - Upload a PDF and ask questions
3. **Summarizer** - Paste text or enter a URL
4. **Research** - Enter any topic
5. **Flashcards** - Generate flashcards for a subject
6. **Visual QA** - Upload an image and ask about it
7. **Study Planner** - Create a study schedule

## 🐛 Troubleshooting

### Backend Issues

**Error: Missing API Key**
- Make sure your `.env` file exists and contains `GEMINI_API_KEY`
- Verify the API key is valid

**Error: Module not found**
```bash
pip install -r requirements.txt
```

**Port 5000 already in use**
- Close other applications using port 5000
- Or change the port in `app.py`:
```python
app.run(host="0.0.0.0", port=5001, debug=True)
```

### Frontend Issues

**Error: Cannot find module**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port 5173 already in use**
- The browser should automatically open a different port
- Or manually change port in `vite.config.js`

**Blank page / White screen**
- Check browser console (F12) for errors
- Make sure backend is running
- Verify proxy settings in `vite.config.js`

### API Connection Issues

**CORS errors in browser console**
- Ensure Flask-CORS is installed: `pip install flask-cors`
- Check `app.py` has CORS enabled
- Restart the backend server

**Network errors**
- Ensure backend is running on `http://localhost:5000`
- Check firewall settings
- Try `http://127.0.0.1:5173` instead

## 📁 Verify Installation

### Backend Health Check

Visit in browser or use curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "api_key_configured": true
}
```

### Frontend Check

Visit `http://localhost:5173` and you should see:
- Landing page with hero section
- Feature cards
- Navigation bar
- No errors in console (F12)

## 🎯 Next Steps

Now that everything is running:

1. **Explore Features** - Try each AI tool
2. **Customize** - Modify colors, text, or features
3. **Build** - Create production build:
   ```bash
   cd frontend
   npm run build
   ```

## 🆘 Still Having Issues?

1. **Check Logs** - Look at terminal output for errors
2. **Browser Console** - Press F12 and check for errors
3. **Dependencies** - Ensure all packages installed correctly
4. **API Key** - Verify Gemini API key is valid
5. **Ports** - Make sure 5000 and 5173 are not blocked

## 📚 Useful Commands

### Backend
```bash
# Start server
python app.py

# Install dependencies
pip install -r requirements.txt

# Check Python version
python --version
```

### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Install dependencies
npm install

# Check Node version
node --version
```

## 🎓 Ready to Learn!

Your AI Study Buddy is now ready to help you learn smarter! 🚀

Visit the landing page and start exploring the AI-powered learning tools.

---

**Happy Learning! 📖✨**
