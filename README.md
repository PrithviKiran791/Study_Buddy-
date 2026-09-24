# Study Buddy — AI Study Assistant & Memory Platform

> An intelligent, full-stack AI study companion featuring multi-provider LLM failover, Retrieval-Augmented Generation (RAG), persistent AI learning memory, production Firebase authentication, and modern glassmorphic UI.

Study Buddy is a full-stack educational platform built for students and researchers. It unifies conversational tutoring, document analysis, automated flashcard generation, multimodal visual QA, and personalized study planning. 

Powered by a resilient multi-provider AI engine featuring **Google Gemma 4** (via OpenRouter), **NVIDIA Nemotron 3.5 Lightning**, and **Zhipu GLM 5.2**, Study Buddy features a persistent **AI Memory Engine** that continuously remembers user preferences, study goals, and weak topics across sessions.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [AI Engine & Multi-Provider Failover](#ai-engine--multi-provider-failover)
- [Persistent AI Memory Architecture](#persistent-ai-memory-architecture)
- [Authentication & Security](#authentication--security)
- [Frontend Architecture & UI Components](#frontend-architecture--ui-components)
- [Backend Architecture & Database Schema](#backend-architecture--database-schema)
- [API Reference](#api-reference)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Installation & Local Setup](#installation--local-setup)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Contributing & License](#contributing--license)

---

## Overview

Modern students and professionals often juggle multiple disconnected tools: search engines, document readers, chat interfaces, flashcard apps, and note-taking systems. Study Buddy centralizes these tasks into a single intelligent workspace:

1. **Personalized AI Tutor**: Conversational companion that adapts to your learning profile and tracks weak subjects across sessions.
2. **Document Retrieval-Augmented Generation (RAG)**: Chat with textbooks, syllabi, and research papers using high-speed vector retrieval and grounded citations.
3. **Multimodal Visual QA**: Upload diagrams, charts, circuit schematics, and handwritten equations for step-by-step breakdown.
4. **Automated Study Artifacts**: Generate interactive 3D flip flashcard decks, comprehensive study notes, and deadline-aware revision schedules.
5. **Persistent Memory & Session History**: SQLite-backed conversation persistence and automatic memory extraction that personalizes responses over time.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Conversational AI Tutor** | Multi-turn study tutor powered by OpenRouter Gemma 4 with subject filtering, LaTeX math rendering, code highlighting, and streaming indicators. |
| **Persistent AI Memory** | Automatically captures learning goals, explanation styles, and weak topics; displays live memory badges and personalization indicators on responses. |
| **PDF Chat (RAG)** | Upload PDF documents to extract text, build vector embeddings via TF-IDF & FAISS, and query contents with grounded citations. |
| **Aceternity UI File Upload** | Interactive dropzone with animated grid backdrops and custom blue dashed border styling for PDF Chat and Visual QA. |
| **Multimodal Visual QA** | Upload diagrams, charts, graphs, and whiteboard notes to receive multimodal explanations powered by Gemma 4 / Vision LLM. |
| **Smart Summarizer** | Distill raw text, academic papers, or live web pages (scraped via BeautifulSoup) into structured key takeaways. |
| **Topic Researcher** | Generate comprehensive, multi-section academic and professional research reports on any subject. |
| **Interactive Flashcards** | Generate custom flashcard decks with 3D card-flip animations, keyboard shortcuts, and deck shuffling. |
| **Automated Study Planner** | Build date-aware study schedules and revision plans based on syllabus topics and target deadlines. |
| **Focus Center (Pomodoro)** | Custom glassmorphic countdown timer with customizable work/break intervals, ambient audio, and full-screen mode. |
| **Production Authentication** | Firebase Auth (Google OAuth & Email/Password) backed by backend JWT verification and SQLite user account synchronization. |
| **Glassmorphic UI System** | Modern dark-mode UI featuring Liquid Glass buttons, Tubelight navigation indicators, and glass toast notifications. |

---

## System Architecture

```mermaid
flowchart TD
    User["Student / Professional"]

    subgraph Client["Frontend Client (React 19 + Vite 6)"]
        UI["React SPA Components"]
        AuthContext["Auth Context (Firebase Client SDK)"]
        Router["React Router v7 (Protected Routes)"]
        AxiosClient["Axios HTTP Interceptor (Bearer Token)"]
    end

    subgraph Server["Backend Server (Python 3.12 / Flask 3.0)"]
        FlaskApp["Flask API Server (app.py)"]
        AuthMiddleware["Token Verifier (@require_auth)"]
        RAGSystem["PDF RAG System (rag_engine.py)"]
        MemoryEngine["AI Memory Engine (services/memory/)"]
        AIFactory["Fallback Provider Factory (ai/factory.py)"]
    end

    subgraph Database["Database Layer (SQLite3)"]
        DB[(study_buddy.db)]
        UsersTbl["users"]
        ConvTbl["conversations"]
        MsgTbl["messages"]
        MemTbl["user_memory"]
    end

    subgraph AIProviders["AI Provider Engine"]
        Gemma["Google Gemma 4 26B (OpenRouter)"]
        Nemotron["NVIDIA Nemotron 3.5 (OpenRouter)"]
        GLM["Zhipu GLM 5.2 (OpenRouter)"]
        HF["Local HuggingFace Fallback"]
    end

    User --> UI
    UI --> AuthContext
    UI --> Router
    Router --> AxiosClient
    AxiosClient -->|"HTTP REST API (/api/*)"| FlaskApp
    FlaskApp --> AuthMiddleware
    AuthMiddleware --> UsersTbl
    FlaskApp --> MemoryEngine
    MemoryEngine --> DB
    FlaskApp --> RAGSystem
    FlaskApp --> AIFactory
    AIFactory --> Gemma
    AIFactory --> Nemotron
    AIFactory --> GLM
    AIFactory -.->|"Offline Fallback"| HF
```

---

## AI Engine & Multi-Provider Failover

The system uses an autonomous fallback provider pattern (`ai/factory.py`). If the primary model encounters rate limits (HTTP 429), quota limits, or upstream timeouts, the engine automatically cascades to secondary and tertiary providers without interrupting the user experience.

```text
               User Prompt / Question
                         │
                         ▼
             FallbackProvider (ai/factory.py)
                         │
       ┌─────────────────┴─────────────────┐
       ▼                                   ▼
Primary: Google Gemma 4             Secondary: Nemotron 3.5
(OpenRouter: google/gemma-4-26b-a4b-it) (NVIDIA / OpenRouter)
       │                                   │
       ├────────── Success? ───────────────┤
       │ (Yes)                       (No)  │
       ▼                                   ▼
Return Response                     Tertiary: GLM 5.2
                                    (Zhipu AI / OpenRouter)
                                           │
                                           ├─────── Success?
                                           │ (No)
                                           ▼
                                    Offline Transformers
                                    (Local T5 / BART / DistilBERT)
```

### Supported Providers

1. **Google Gemma 4 (`GemmaProvider`)**: Primary model (`google/gemma-4-26b-a4b-it`) accessed via OpenRouter for low-latency streaming text generation and multimodal vision analysis.
2. **NVIDIA Nemotron (`NemotronProvider`)**: Secondary model accessed via OpenRouter (`nvidia/nemotron-3.5-lightning:free`) with high-throughput reasoning.
3. **Zhipu GLM (`GLMProvider`)**: Tertiary model accessed via OpenRouter (`z-ai/glm-5.2:free`) for deep reasoning.
4. **Local Hugging Face Transformers**: Local offline fallback pipelines for question generation (`t5-base-qg-hl`), summarization (`BART`), and QA (`DistilBERT`).

---

## Persistent AI Memory Architecture

Study Buddy features an automated **AI Memory Engine** (`services/memory/`) that enables the AI tutor to remember user learning goals, explanation styles, and weak subjects across study sessions.

```text
User Message: "I struggle with dynamic programming and prefer code examples in Python"
                                │
                                ▼
                 memory_extractor.py
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
[LEARNING]               [PREFERENCE]              [SUBJECT]
weak_topic:              explanation_style:        target_subject:
"dynamic programming"    "code examples"           "Python"
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
             SQLite Database: user_memory table
                                │
                                ▼
                     context_builder.py
  (Injects Profile into System Prompt on all future queries)
                                │
                                ▼
Response: "Here is a step-by-step breakdown using Python code..."
Tag in Chat UI: ✨ Personalized with 3 memories
```

### Memory Components

1. **Memory Extractor (`services/memory/memory_extractor.py`)**:
   - Detects explicit instructions (`"Remember that..."`, `"Keep in mind..."`).
   - Captures user identity (`"Call me..."`, `"My name is..."`).
   - Learns explanation preferences (`"Prefer code examples"`, `"Keep it concise"` vs `"Detailed"`).
   - Identifies study goals (`"Preparing for AWS certification"`, `"Exam in 2 weeks"`).
   - Flags weak topics (`"I struggle with recursion"`, `"Confused about pointers"`).
   - Records academic majors and target subjects.

2. **Context Builder (`services/memory/context_builder.py`)**:
   - Dynamically constructs a unified prompt incorporating:
     - Base system instructions
     - Active user learning profile (`[GOAL]`, `[PREFERENCE]`, `[WEAK TOPIC]`)
     - Previous conversation summary
     - Recent chat history
     - RAG document excerpts (if active)
     - Current question

3. **Frontend Memory Visibility & Controls ([`Chatbot.jsx`](file:///c:/Users/prith/Desktop/My%20Projects/Personal/Study_assistant/frontend/src/pages/Chatbot.jsx))**:
   - **Live Memory Badge**: Header badge displaying `🧠 AI Memory (N)` with live count.
   - **Memory Inspector Modal**: Slide-over drawer listing all stored memories with delete controls and a direct link to Settings.
   - **Real-Time Capture Toast**: Alerts the user whenever a new durable memory is extracted.
   - **Personalization Tag ([`ChatMessage.jsx`](file:///c:/Users/prith/Desktop/My%20Projects/Personal/Study_assistant/frontend/src/components/ChatMessage.jsx))**: Shows `✨ Personalized with N memories` on AI answers that utilized the learning profile.
   - **Sessions Drawer**: Resume past persistent conversations stored in SQLite.

---

## Authentication & Security

Study Buddy combines **Firebase Authentication** on the client with **backend token verification** and SQLite user synchronization:

1. **Client Authentication**:
   - Powered by Firebase Client SDK (`config/firebase.js`).
   - Supports **Google OAuth** single-sign-on and **Email/Password** registration/login.
   - Rendered using the Lightswind UI login popover card (`login-popover-model.jsx`).
   - Route protection implemented via `<ProtectedRoute />` in `App.jsx`, redirecting unauthenticated users to `/login`.

2. **Backend Verification (`auth/firebase_auth.py`)**:
   - Enforces `@require_auth` decorator across protected API endpoints.
   - Verifies incoming Firebase ID Tokens via `firebase-admin` with a fallback decoder for local development.
   - Automatically synchronizes authenticated users into the SQLite `users` table:
     ```python
     user = sync_user_to_db(decoded_token)
     request.user = user
     ```

3. **API Key Security**:
   - All AI model credentials (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`) remain strictly on the Flask server.
   - Client applications never receive or store third-party LLM credentials.

---

## Frontend Architecture & UI Components

The client application is built with **React 19**, **Vite 6**, and **Tailwind CSS v3**:

```text
frontend/src/
├── api/                           # Axios HTTP Services
│   ├── axios.js                   # Interceptor adding Firebase Bearer tokens
│   ├── auth.js                    # Auth endpoints
│   ├── chatbot.js                 # Chat, memory, & conversation endpoints
│   ├── flashcards.js              # Flashcards API
│   ├── pdf.js                     # PDF RAG API
│   ├── research.js                # Research generator API
│   └── summarizer.js              # Summarizer API
├── components/
│   ├── ai/                        # AI Thinking State UX
│   │   ├── AIThinkingIndicator.jsx
│   │   └── ThoughtLine.jsx
│   ├── lightswind/                # Lightswind Auth Components
│   │   └── login-popover-model.jsx
│   ├── Toast/                     # Glassmorphic Toast Notification System
│   │   ├── Toast.jsx
│   │   └── ToastContainer.jsx
│   ├── ui/                        # Reusable UI Primitives
│   │   ├── file-upload.jsx        # Aceternity UI File Upload
│   │   ├── loader.jsx             # Aceternity UI LoaderOne
│   │   ├── liquid-glass-button.tsx# Liquid Glass Button with SVG filters
│   │   ├── BorderGlow.jsx         # Glowing interactive borders
│   │   ├── JellyRadio.jsx         # Spring-animated radio controls
│   │   └── PromptBar.jsx          # Slash command & source selector input
│   ├── ChatMessage.jsx            # Message bubble with personalization badge
│   ├── GlassCard.jsx              # Backdrop-blur container
│   ├── Navbar.jsx                 # Header with user profile popover
│   └── MarkdownViewer.jsx         # Syntax-highlighted Markdown renderer
├── pages/                         # Lazy-loaded Route Views
│   ├── Home.jsx                   # Landing Page (with LoaderOne intro)
│   ├── Chatbot.jsx                # AI Tutor with Memory Inspector
│   ├── PDFChat.jsx                # PDF RAG with Aceternity FileUpload
│   ├── VisualQA.jsx               # Multimodal Vision with FileUpload
│   ├── Summarizer.jsx             # Text & URL Summarizer
│   ├── Research.jsx               # Research Report Generator
│   ├── Flashcards.jsx             # 3D Flip Flashcard Deck
│   ├── StudyPlanner.jsx           # Revision Schedule Generator
│   ├── FocusCenter.jsx            # Pomodoro Focus Timer
│   ├── Settings.jsx               # AI Memory & Connection Settings
│   └── Login.jsx                  # Sign In Page (with LoaderOne)
├── context/
│   └── AuthContext.jsx            # Global Firebase Auth State Provider
└── App.jsx                        # Route Registration & ProtectedRoute wrapper
```

### Notable UI Components

- **Aceternity UI `FileUpload` (`components/ui/file-upload.jsx`)**: Drag-and-drop component with interactive animated grid backdrop, file size counters, Framer Motion transitions, and custom blue dashed border styling. Used in both **PDF Chat** and **Visual QA**.
- **Aceternity UI `LoaderOne` (`components/ui/loader.jsx`)**: Dual counter-rotating concentric glowing rings with a central pulsing orb, scoped exclusively to the **Landing Page** and **Login Page**.
- **`LiquidButton` (`components/ui/liquid-glass-button.tsx`)**: Liquid glassmorphic action button featuring SVG turbulence/displacement filters and metallic gradients.
- **Sleek Navbar with User Dropdown (`components/Navbar.jsx`)**: Un-clustered header layout featuring far-left brand alignment, tubelight lamp indicator, theme toggle, and a single User Avatar Pill that reveals a profile card with settings and logout controls.

---

## Backend Architecture & Database Schema

The backend uses **Python 3.12** and **Flask 3.0**, backed by an embedded **SQLite3** database (`study_buddy.db`).

### Database Schema

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT UNIQUE,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '',
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP
);

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 4. User Memory Table
CREATE TABLE IF NOT EXISTS user_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    memory_type TEXT NOT NULL,    -- 'goal', 'preference', 'learning', 'subject', 'profile'
    memory_key TEXT NOT NULL,     -- 'study_goal', 'explanation_style', 'weak_topic', etc.
    memory_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## API Reference

### Core Endpoints

#### 1. Conversational AI Tutor
- **`POST /api/chat`** *(Requires Auth)*
  - **Body**: `{ "message": "...", "conversation_id": "...", "history": [] }`
  - **Response**:
    ```json
    {
      "answer": "...",
      "conversation_id": "ab12cd34ef56",
      "title": "Calculus derivatives",
      "memories_used": 2,
      "new_memories": [
        { "type": "learning", "key": "weak_topic", "value": "Chain rule" }
      ],
      "all_memories": [...]
    }
    ```

#### 2. Persistent Conversations
- **`GET /api/conversations`** *(Requires Auth)*: List all user chat sessions.
- **`POST /api/conversations`** *(Requires Auth)*: Create a new conversation session.
- **`GET /api/conversations/<id>`** *(Requires Auth)*: Fetch conversation details and messages.
- **`DELETE /api/conversations/<id>`** *(Requires Auth)*: Delete a conversation.

#### 3. AI Learning Memory
- **`GET /api/memory`** *(Requires Auth)*: Retrieve all active user learning profile memories.
- **`DELETE /api/memory/<id>`** *(Requires Auth)*: Delete a single memory item.
- **`DELETE /api/memory`** *(Requires Auth)*: Clear all user memories.

#### 4. Document RAG & PDF Processing
- **`POST /api/upload-pdf`**: Upload and index a PDF document (`action="index"`).
- **`POST /api/pdf-chat`**: Query an indexed PDF using vector similarity search.

#### 5. Additional Study Tools
- **`POST /api/visual-qa`**: Analyze an uploaded image or diagram with Gemini Vision.
- **`POST /api/summarize`**: Summarize long text snippets or live web URLs.
- **`POST /api/research`**: Generate multi-section academic research reports.
- **`POST /api/flashcards`**: Extract interactive flashcard decks from topics or text.
- **`POST /api/study-plan`**: Generate structured study plans from syllabus topics and target deadlines.
- **`GET /api/health`**: Health check returning server status and timestamp.

---

## Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, Vite 6, TypeScript / JSX | Modern reactive SPA framework & fast HMR bundler |
| **Styling & Motion** | Tailwind CSS v3, Framer Motion, GSAP | Glassmorphic design, spring animations, 3D card flips |
| **Client Auth** | Firebase Client SDK v11 | Google OAuth, Email/Password auth, ID token issuance |
| **UI Components** | Aceternity UI, Radix UI Slot, Lucide Icons | Dropzone FileUpload, LoaderOne, LiquidButton |
| **Backend Core** | Python 3.12, Flask 3.0, Flask-CORS | REST API server, request validation, middleware |
| **Token Verification** | Firebase Admin SDK, PyJWT | Cryptographic verification of Firebase Bearer tokens |
| **Database** | SQLite3 (`study_buddy.db`) | Relational storage for users, sessions, and AI memories |
| **AI LLM Providers** | Google Gemini, NVIDIA Nemotron, Zhipu GLM | Multi-provider generative text and multimodal analysis |
| **PDF & Vector RAG** | PyMuPDF (`fitz`), Scikit-learn, FAISS | High-speed PDF text parsing & vector similarity search |
| **Web Scraping** | BeautifulSoup4, Requests | Live URL article content extraction for summarization |

---

## Project Directory Structure

```text
Study_Buddy/
│
├── backend/                           # Python 3.12 / Flask Backend Root
│   ├── app.py                         # Flask REST API Server & Route Handlers
│   ├── config.py                      # Centralized Configuration & SQLite Helper
│   ├── rag_engine.py                  # PyMuPDF + FAISS Vector RAG Engine
│   ├── requirements.txt               # Backend Python Dependencies
│   ├── Procfile                       # Production WSGI Server Start Command (Railway)
│   ├── .env.example                   # Backend Environment Variables Template
│   │
│   ├── ai/                            # Multi-Provider AI Engine
│   │   ├── __init__.py
│   │   ├── factory.py                 # Autonomous Fallback Provider Factory
│   │   ├── provider.py                # Abstract Base AI Provider Class
│   │   ├── gemini.py                  # Google Gemini SDK Integration
│   │   ├── nemotron.py                # NVIDIA Nemotron (OpenRouter) Integration
│   │   └── glm.py                     # Zhipu GLM 5.2 (OpenRouter) Integration
│   │
│   ├── auth/                          # Authentication Layer
│   │   ├── __init__.py
│   │   └── firebase_auth.py           # Token Verification & SQLite User Sync Decorator
│   │
│   ├── services/memory/               # Persistent AI Memory Engine
│   │   ├── __init__.py
│   │   ├── context_builder.py         # Multi-Context Prompt Assembler
│   │   ├── memory_extractor.py        # Dynamic User Preference & Goal Extractor
│   │   ├── conversation_service.py    # Session & Message CRUD Service
│   │   ├── profile_service.py         # User Memory CRUD Service
│   │   └── summary_service.py         # Automatic Conversation Summarizer
│   │
│   ├── prompts/                       # Modular Prompt Templates
│   │   ├── __init__.py
│   │   ├── chat.py                    # AI Tutor Prompts
│   │   ├── flashcards.py              # Flashcard Extraction Prompts
│   │   ├── planner.py                 # Study Plan Generator Prompts
│   │   ├── rag.py                     # Document QA Prompts
│   │   ├── research.py                # Deep-Dive Academic Prompts
│   │   └── summary.py                 # Text Summarization Prompts
│   │
│   ├── static/                        # Backend Static Assets
│   │   └── css/style.css
│   │
│   └── tests/                         # Backend Test Suite
│       ├── __init__.py
│       ├── test_model_config.py
│       └── test_production_config.py
│
├── frontend/                          # React 19 / Vite 6 Frontend Root
│   ├── package.json                   # Node Dependencies & Build Scripts
│   ├── package-lock.json
│   ├── vite.config.js                 # Vite 6 Bundler Configuration
│   ├── tailwind.config.js             # Tailwind Design System Configuration
│   ├── postcss.config.js              # PostCSS Configuration
│   ├── tsconfig.json                  # TypeScript Configuration
│   ├── index.html                     # HTML Entry Point
│   ├── vercel.json                    # Vercel SPA Routing Rewrites
│   ├── .env.example                   # Frontend Environment Variables Template
│   │
│   ├── public/                        # Static Public Assets (open-book.png)
│   │
│   └── src/
│       ├── api/                       # Axios API Service Modules & Interceptors
│       ├── assets/                    # Static Assets
│       ├── components/                # UI Primitives, Modals, & AI Animations
│       ├── context/                   # AuthContext & ThemeContext Providers
│       ├── hooks/                     # Custom React Hooks (useChat, useAuth)
│       ├── layouts/                   # Layout Wrappers (MainLayout)
│       ├── lib/                       # Utility Functions (cn helper)
│       ├── pages/                     # Full Page Views
│       ├── App.jsx                    # Router, ProtectedRoute, & Toast Root
│       └── main.jsx                   # React DOM Entry Point
│
├── .github/workflows/
│   └── node.js.yml                    # Automated Frontend CI Workflow
│
├── .gitignore                         # Comprehensive Monorepo Git Ignore
├── .env.example                       # Root Environment Template
├── README.md                          # Full Project Documentation
└── LICENSE                            # MIT License
```

---

## Installation & Local Setup

### Prerequisites

- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: 18.0 or higher
- **NPM**: v9 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/PrithviKiran791/Study_Buddy-.git
cd Study_assistant
```

### 2. Set Up the Backend

```bash
# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Set Up the Frontend

```bash
cd frontend
npm install
cd ..
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# AI Model API Keys (Server-Side Only — NEVER expose to frontend)
OPENROUTER_API_KEY=your_openrouter_api_key_here
NVIDIA_API_KEY=your_nvidia_api_key_here
GLM_API_KEY=your_glm_or_openrouter_key_here

# Provider Configuration
DEFAULT_MODEL=gemma
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning:free
GLM_MODEL=z-ai/glm-5.2:free
GLM_VISION_MODEL=z-ai/glm-5.2:free

# Flask Security
SECRET_KEY=your_random_flask_secret_key

# Firebase Admin Service Account (Optional)
# FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
```

---

## Running Locally

### 1. Start the Flask Backend Server

```bash
# From the project root with venv activated
python app.py
```
*The Flask server runs locally at `http://127.0.0.1:5000` and automatically initializes the SQLite schema.*

### 2. Start the Vite Frontend Server

```bash
# In a new terminal
cd frontend
npm run dev
```
*The React development server runs at `http://localhost:5173`.*

---

## Production Deployment

### 1. Deploy Backend to Railway (Flask + SQLite Volume)

Railway hosts the Python/Flask backend and provides persistent disk storage for the SQLite database:

1. **Push to GitHub**: Ensure your latest changes are pushed to your GitHub repository.
2. **Create New Railway Project**:
   - Go to [Railway](https://railway.app/) and click **New Project** > **Deploy from GitHub repo**.
   - Select your repository (`Study_Buddy-`).
3. **Add a Persistent Volume for SQLite**:
   - In your Railway project canvas, click on your service.
   - Go to the **Volumes** tab and click **Add Volume**.
   - Set **Mount Path** to `/data`.
4. **Configure Environment Variables**:
   In the service's **Variables** tab, set:
   ```env
   PORT=5000
   DATABASE_FILE=/data/study_buddy.db
   SECRET_KEY=generate_a_random_32_byte_hex_string
   FRONTEND_URL=https://your-studybuddy.vercel.app,http://localhost:5173
   DEFAULT_MODEL=gemma
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=google/gemma-4-26b-a4b-it
   NVIDIA_API_KEY=your_nvidia_api_key
   GLM_API_KEY=your_glm_or_openrouter_key
   # Choose one of the Firebase Admin options below:
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   # OR:
   # FIREBASE_PROJECT_ID=studyassistant-26fb6
   # FIREBASE_CLIENT_EMAIL=...
   # FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```
5. **Verify Start Command**:
   Railway automatically detects `Procfile`:
   ```procfile
   web: gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 app:app
   ```
6. **Generate Domain**:
   - Under service **Settings** > **Networking**, click **Generate Domain** (e.g. `https://studybuddy-production.up.railway.app`).
   - Copy this URL for frontend configuration.

---

### 2. Deploy Frontend to Vercel (React + Vite)

1. **Import Repository**:
   - Go to [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
   - Import your GitHub repository (`Study_Buddy-`).
2. **Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` *(Important: set to `frontend`)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   Add the following under **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://your-railway-backend.up.railway.app
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=studyassistant-26fb6.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=studyassistant-26fb6
   VITE_FIREBASE_STORAGE_BUCKET=studyassistant-26fb6.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=1047865212331
   VITE_FIREBASE_APP_ID=1:1047865212331:web:37cd51aa786bc05cee66ee
   VITE_FIREBASE_MEASUREMENT_ID=G-QF9RTVB2K5
   ```
4. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend and serve it with automatic SPA rewrites (`frontend/vercel.json`).

---

### 3. Firebase Console Configuration

1. **Authorized Domains**:
   - Open [Firebase Console](https://console.firebase.google.com/) > Your Project > **Authentication** > **Settings** > **Authorized domains**.
   - Add your Vercel deployment domain (e.g. `your-studybuddy.vercel.app`).
2. **Service Account Credentials**:
   - Go to **Project Settings** > **Service accounts** > **Generate new private key**.
   - Use the key JSON either directly in `FIREBASE_SERVICE_ACCOUNT_JSON` on Railway or locally as `serviceAccountKey.json`.

---

## Contributing & License

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/MyFeature`.
3. Commit your changes: `git commit -m "Add MyFeature"`.
4. Run `npm run build` in `frontend/` to confirm zero compilation errors.
5. Push to your branch and submit a Pull Request.

This project is licensed under the **MIT License**.
