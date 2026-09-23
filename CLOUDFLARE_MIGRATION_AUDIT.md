# STUDY BUDDY CLOUDFLARE MIGRATION AUDIT

---

## 1. Current Architecture

The existing **Study Buddy** application is structured as a full-stack, decoupled monorepo composed of a React single-page application (SPA) and a Python/Flask REST API backend:

```text
[ Client Browser ]
        │
        ▼
[ React 19 + Vite 6 SPA ] (Tailwind CSS, Framer Motion, Lucide)
        │
        ├── Firebase Client SDK v12 (Email/Password, Google OAuth, GitHub OAuth)
        │       └── Issues Firebase JWT ID Token
        │
        └── Axios API Client (with Bearer Token Interceptor & VITE_API_BASE_URL)
                │
                ▼
      [ Python 3.12 / Flask 3.0 REST API ]
        │
        ├── auth/firebase_auth.py: Firebase Admin SDK / PyJWT verification & user sync
        ├── config.py: Environment configuration & DB connection helper
        │
        ├── Database Layer:
        │       └── Embedded SQLite3 (study_buddy.db)
        │
        ├── Persistent AI Memory Engine:
        │       ├── services/memory/conversation_service.py (Sessions & messages)
        │       ├── services/memory/profile_service.py (Fact & preference CRUD)
        │       ├── services/memory/memory_extractor.py (Regex-based intent parsing)
        │       ├── services/memory/context_builder.py (Dynamic prompt assembly)
        │       └── services/memory/summary_service.py (Periodic conversation compression)
        │
        ├── In-Memory PDF Vector RAG:
        │       └── rag_engine.py (PyMuPDF + FAISS + Sentence-Transformers + Scikit-learn)
        │
        └── Multi-Provider AI Fallback Engine:
                ├── Google Gemini SDK (google-generativeai)
                ├── OpenRouter / NVIDIA Nemotron API (requests)
                ├── OpenRouter / Zhipu GLM API (requests)
                └── Local PyTorch / Hugging Face Fallback (T5, BART, DistilBERT)
```

---

## 2. Current Repository Structure

The current codebase is organized into clean `frontend/` and `backend/` directories:

```text
Study_Buddy/
├── .github/
│   └── workflows/
│       └── node.js.yml                    # Automated frontend CI (npm ci & build)
├── backend/
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── factory.py                     # Autonomous multi-provider fallback engine
│   │   ├── gemini.py                      # Google Gemini integration
│   │   ├── glm.py                         # GLM-5.2 / OpenRouter integration
│   │   ├── nemotron.py                    # NVIDIA Nemotron / OpenRouter integration
│   │   └── provider.py                    # Abstract BaseAIProvider definition
│   ├── auth/
│   │   ├── __init__.py
│   │   └── firebase_auth.py               # Token verification & SQLite user sync
│   ├── prompts/
│   │   ├── __init__.py
│   │   ├── chat.py, flashcards.py, planner.py, questions.py, rag.py, research.py, summary.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── memory/
│   │       ├── __init__.py
│   │       ├── context_builder.py         # 6-layer prompt assembler
│   │       ├── memory_extractor.py        # Regex preference extractor
│   │       ├── conversation_service.py    # Conversation & message CRUD
│   │       ├── profile_service.py         # User memory key-value CRUD
│   │       └── summary_service.py         # Auto-summarization of older messages
│   ├── static/
│   │   └── css/style.css                  # Legacy stylesheet artifact
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_model_config.py
│   │   └── test_production_config.py
│   ├── .env.example                       # Backend secrets template
│   ├── app.py                             # Flask routes, middleware, and entry point
│   ├── config.py                          # Provider discovery & DB connection helper
│   ├── Procfile                           # Gunicorn WSGI start command
│   ├── rag_engine.py                      # PyMuPDF + FAISS/TF-IDF RAG system
│   └── requirements.txt                   # Backend Python dependencies
├── frontend/
│   ├── public/
│   │   └── open-book.png                  # Static favicon & brand icon
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.js                    # (Unused legacy auth stub)
│   │   │   ├── axios.js                   # Centralized Axios instance & token interceptor
│   │   │   ├── chatbot.js                 # Chat, memory, & conversation endpoints
│   │   │   ├── flashcards.js              # Flashcard deck generator
│   │   │   ├── pdf.js                     # PDF upload & RAG query endpoints
│   │   │   ├── research.js                # Academic topic report generator
│   │   │   └── summarizer.js              # Text & link summarization, QA, study plan
│   │   ├── assets/
│   │   │   └── open-book.png
│   │   ├── components/                    # UI primitives, dialogs, timers, widgets
│   │   ├── config/
│   │   │   └── firebase.js                # Firebase Client initialization & providers
│   │   ├── context/
│   │   │   ├── AuthContext.jsx            # Auth state provider (login, register, OAuth)
│   │   │   └── ThemeContext.jsx           # Dark/Light theme provider
│   │   ├── hooks/
│   │   │   ├── useAuth.js, useChat.js
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx             # Shell with responsive sidebar & tubelight nav
│   │   ├── lib/
│   │   │   └── utils.js                   # Class merging (clsx + twMerge)
│   │   ├── pages/
│   │   │   ├── Chatbot.jsx, Dashboard.jsx, Flashcards.jsx, FocusCenter.jsx,
│   │   │   ├── Home.jsx, Login.jsx, Notes.jsx, NotFound.jsx, PDFChat.jsx,
│   │   │   ├── Quiz.jsx, Register.jsx, Research.jsx, Settings.jsx,
│   │   │   ├── StudyPlanner.jsx, Summarizer.jsx, VisualQA.jsx
│   │   ├── App.jsx                        # Client router & toast container
│   │   ├── index.css                      # Global Tailwind directives & dark theme
│   │   └── main.jsx                       # DOM hydration
│   ├── .env.example                       # Frontend client variables template
│   ├── index.html                         # Vite HTML template
│   ├── package.json                       # React 19 dependencies & scripts
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json                        # SPA rewrite rules
│   └── vite.config.js                     # Dev proxy & build optimization
├── .env.example                           # Root repository configuration template
├── .gitignore                             # Ignored patterns
├── GETTING_STARTED.md, GIT_COMMANDS.txt, LICENSE, README.md, setup.bat
```

---

## 3. Frontend Analysis

- **Framework & Libraries**:
  - React 19.0.0, Vite 6.0.5, React Router DOM 7.1.3
  - Framer Motion 12.0.0, Lucide React 0.468.0, Recharts 3.9.2, Tailwind CSS 3.4.17
- **Routing**: Client-side routing with `BrowserRouter` in `frontend/src/App.jsx`. All protected routes are nested inside `<ProtectedRoute>` which renders `<MainLayout>`.
- **API Communication & Axios Config**:
  - Centralized in `frontend/src/api/axios.js`.
  - Base URL logic:
    ```javascript
    const getBaseUrl = () => {
      const envUrl = import.meta.env.VITE_API_BASE_URL?.trim()
      if (!envUrl) return '/api'
      const trimmed = envUrl.replace(/\/+$/, '')
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
    }
    ```
  - An Axios request interceptor attaches the Firebase ID token as `Authorization: Bearer <token>` automatically on every outgoing HTTP request.
- **Authentication Flow**:
  - Handled in `frontend/src/context/AuthContext.jsx` using the Firebase Client SDK v12.
  - Supports Email/Password signin, Google Popup (`signInWithPopup`), GitHub Popup, and Password Reset.
  - Sessions persist via `browserLocalPersistence`.
- **Backend URL & Port Assumptions**:
  - `frontend/vite.config.js` sets a local development proxy forwarding `/api` to `http://127.0.0.1:5000`.
  - `frontend/src/pages/Settings.jsx` (line 201) displays `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'` as a cosmetic label in the API diagnostics panel.
  - `frontend/src/pages/Dashboard.jsx` (line 86) contains a fallback test call to `/api/dashboard/summary`.
- **Cloudflare Pages Compatibility**:
  - **100% Compatible**. The frontend generates a static SPA bundle via `npm run build` into `frontend/dist/`.
  - Cloudflare Pages natively serves Vite SPAs. Adding a simple `frontend/public/_redirects` file (`/* /index.html 200`) ensures client-side routing on page refresh.

---

## 4. Backend Analysis

The backend in `backend/app.py` exposes 16 HTTP endpoints:

| Route | Method | Auth Required? | Request Payload | Response Payload | DB Access | AI / RAG Dependency | Cloudflare Compatibility | Migration Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | No | None | `{"message", "version", "status"}` | None | None | **Compatible** | Trivial Worker endpoint. |
| `/api/health` | `GET` | No | None | `{"status", "database", "providers_configured"}` | `SELECT 1` | `config.get_provider_status()` | **Compatible** | Check D1 connectivity and API keys. |
| `/api/llm/status` | `GET` | No | None | Provider config summary | None | `config.get_provider_status()` | **Compatible** | Direct key status reflection. |
| `/api/generate-questions` | `POST` | No | `{"paragraph": str}` | `{"questions": list, "input_paragraph": str}` | None | Gemini/OpenRouter (Fallback: T5) | **Compatible** | Drop T5 local fallback; use API only. |
| `/api/summarize` | `POST` | No | `{"text": str, "url": str}` | `{"summary": str, "input_preview": str}` | None | Gemini/OpenRouter (Fallback: BART) | **Compatible** | Replace `BeautifulSoup` with `HTMLRewriter`/fetch; drop BART. |
| `/api/answer-question` | `POST` | No | `{"context": str, "question": str, "history": list}` | `{"answer": str, "history": list}` | None | Gemini/OpenRouter (Fallback: DistilBERT) | **Compatible** | Drop DistilBERT; route via Gemini/OpenRouter. |
| `/api/study-plan` | `POST` | No | `{"syllabus", "topics", "start_date", "deadline"}` | `{"study_plan": str}` | None | Gemini/OpenRouter | **Compatible** | Prompt template via HTTPS fetch. |
| `/api/research` | `POST` | No | `{"topic": str}` | `{"topic": str, "content": str}` | None | Gemini/OpenRouter | **Compatible** | Prompt template via HTTPS fetch. |
| `/api/generate-notes` | `POST` | No | `{"topic": str, "material": str}` | `{"topic": str, "notes": str}` | None | Gemini/OpenRouter | **Compatible** | Prompt template via HTTPS fetch. |
| `/api/web-search` | `POST` | No | `{"question": str}` | `{"question": str, "answer": str}` | None | Gemini/OpenRouter | **Compatible** | Prompt template via HTTPS fetch. |
| `/api/flashcards` | `POST` | No | `{"topic": str, "count": int}` | `{"topic": str, "cards": list}` | None | Gemini/OpenRouter | **Compatible** | JSON schema generation via HTTPS. |
| `/api/upload-pdf` | `POST` | No | `multipart/form-data` (`pdf_file`, `action`) | `{"session_id", "message", "preview"}` or summary/cards | None | PyMuPDF, FAISS, SentenceTransformers | **Incompatible as-is** | Replace PyMuPDF with `unpdf`/pdfjs-dist; replace FAISS with Vectorize/D1. |
| `/api/pdf-chat` | `POST` | No | `{"session_id": str, "question": str}` | `{"answer": str, "context_preview": str}` | In-memory session | `PDFRagSystem` + Gemini/OpenRouter | **Incompatible as-is** | Stateless Workers require D1/Vectorize rather than memory dict. |
| `/api/visual-qa` | `POST` | No | `multipart/form-data` (`image`, `question`) | `{"question", "answer", "image_data"}` | None | Gemini Vision / GLM Vision | **Compatible** | Send Base64 payload directly to Gemini REST API. |
| `/api/user/me` | `GET` | **Yes** | Bearer token | `{"user": obj}` | `users` | None | **Compatible** | Verify JWT with Google JWKS and query D1. |
| `/api/conversations` | `GET` | **Yes** | Bearer token | `{"conversations": list}` | `conversations` | None | **Compatible** | SQL query against D1. |
| `/api/conversations` | `POST` | **Yes** | `{"title": str}` | `{"conversation": obj}` | `conversations` | None | **Compatible** | `INSERT INTO conversations` on D1. |
| `/api/conversations/<id>` | `GET` | **Yes** | Bearer token | `{"conversation": obj, "messages": list}` | `conversations`, `messages` | None | **Compatible** | Join/query conversations & messages on D1. |
| `/api/conversations/<id>` | `DELETE` | **Yes** | Bearer token | `{"success": true}` | `conversations`, `messages` | None | **Compatible** | Cascade delete on D1. |
| `/api/memory` | `GET` | **Yes** | Bearer token | `{"memories": list}` | `user_memory` | None | **Compatible** | `SELECT ... FROM user_memory` on D1. |
| `/api/memory/<id>` | `DELETE` | **Yes** | Bearer token | `{"success": true}` | `user_memory` | None | **Compatible** | `DELETE ... FROM user_memory` on D1. |
| `/api/memory` | `DELETE` | **Yes** | Bearer token | `{"success": true}` | `user_memory` | None | **Compatible** | Clear user memories on D1. |
| `/api/chat` | `POST` | **Yes** | `{"message": str, "conversation_id": str}` | `{"answer", "conversation_id", "memories_used", ...}` | `conversations`, `messages`, `user_memory` | Context Builder, Memory Extractor, LLM | **Compatible** | Pure SQL + regex memory extraction + fetch to LLM. |

---

## 5. Authentication Analysis

### Current Implementation
1. The client logs in via Firebase SDK (`frontend/src/context/AuthContext.jsx`).
2. The client fetches the Firebase ID Token (`currentUser.getIdToken()`).
3. Axios attaches `Authorization: Bearer <ID_TOKEN>`.
4. In `backend/auth/firebase_auth.py`, `@require_auth`:
   - Extracts the token from the header.
   - Invokes `firebase_admin.auth.verify_id_token(id_token)` (with a fallback to `jwt.decode` if uninitialized).
   - Calls `sync_user_to_db(decoded_token)` to upsert the user into the SQLite `users` table.
   - Sets `request.user` on the Flask request context.

### Cloudflare Worker Incompatibility & Solution
- **The Issue**: Neither Python `firebase-admin` nor Node `firebase-admin` can run in Cloudflare Workers because they depend on native Node/gRPC libraries.
- **The Solution**: Firebase ID Tokens are standard OpenID Connect (OIDC) JWTs signed with RSA-SHA256 (RS256).
- Google publishes public signing certificates at:  
  `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`
- A Cloudflare Worker verifies tokens using standard Web Crypto (`crypto.subtle` or the lightweight `jose` library) by:
  1. Verifying token signature against Google's public x509 certs / JWKS.
  2. Validating claims: `iss == https://securetoken.google.com/<PROJECT_ID>`, `aud == <PROJECT_ID>`, `exp > now`, and `sub != null`.
  3. Extracting `uid`, `email`, `name`, `picture`.
  4. Executing `SELECT` / `INSERT` on Cloudflare D1 `users`.
- **Security Guarantee**: Zero private keys or service account credentials are required in the Worker or frontend.

---

## 6. Database Analysis

### Current SQLite Schema (`backend/app.py` & SQLite Database)

```sql
-- 1. Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT UNIQUE,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '',
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- 2. Conversations Table
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Messages Table
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 4. User Memory Table
CREATE TABLE user_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    memory_type TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Cloudflare D1 Mapping
Cloudflare D1 is SQLite. All existing column types (`INTEGER`, `TEXT`, `TIMESTAMP`), primary keys, and foreign keys map directly to D1 with zero syntax modification.

---

## 7. AI Provider Analysis

| Provider | SDK / Protocol | Current Model | Worker Compatible? | Cloudflare Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini** | `google.generativeai` (Python SDK) | `gemini-3.6-flash`, `gemini-1.5-flash` | **No SDK, Yes via REST** | Use Gemini REST API: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}`. Native JSON fetch, fast, no SDK needed. |
| **NVIDIA Nemotron** | `requests` over HTTP | `nvidia/nemotron-3.5-lightning:free` | **Yes (100%)** | `fetch("https://openrouter.ai/api/v1/chat/completions")` or NVIDIA endpoint. Standard OpenAI-compatible format. |
| **Zhipu GLM** | `requests` over HTTP | `z-ai/glm-5.2:free` | **Yes (100%)** | `fetch("https://openrouter.ai/api/v1/chat/completions")`. Standard OpenAI-compatible format. |
| **Hugging Face Local Fallbacks** | `transformers`, `torch` | T5-base, BART-large-cnn, DistilBERT | **No (0%)** | Remove local ML models. Fallback chains run across Gemini, Nemotron, and GLM (or Cloudflare Workers AI `@cf/meta/llama-3-8b-instruct`). |

---

## 8. RAG Analysis

### Current Pipeline
```text
PDF Upload -> fitz (PyMuPDF) extracts raw text
           -> Sliding window chunking (500 words, 100 overlap)
           -> sentence-transformers ("all-MiniLM-L6-v2") generates 384-dim embeddings
           -> FAISS builds in-memory IndexFlatL2
           -> Stored in server memory dict: pdf_rag_sessions[session_id]
           -> User Query -> FAISS search -> Top 3 chunks -> LLM Prompt
```

### Cloudflare Incompatibilities
1. **PyMuPDF**: C-binary library; cannot execute inside V8 isolate.
2. **sentence-transformers / PyTorch**: Cannot execute in V8 isolate.
3. **FAISS**: C++ library; cannot execute in V8 isolate.
4. **In-Memory State**: Worker isolates are ephemeral and distributed across 300+ edge datacenters. In-memory session dictionaries do not persist across requests.

### Cloudflare-Native Replacement Architecture
- **Document Parsing**: Use `unpdf` (Wasm-based PDF parser engineered specifically for Cloudflare Workers) or extract text on the client before sending.
- **Embedding Generation**: Use **Cloudflare Workers AI** embedding model `@cf/baai/bge-base-en-v1.5` (or Google Gemini `text-embedding-004`).
- **Vector Storage & Similarity Search**:
  - *Option A (Recommended for Study Sessions)*: Store chunks and 384-dim embedding arrays directly in Cloudflare D1. Since a study PDF produces only 10–100 chunks, in-memory cosine similarity calculation in JavaScript over Float32Arrays takes < 1 ms in the Worker, avoiding extra vector database costs.
  - *Option B*: Cloudflare **Vectorize** index for larger scale.

---

## 9. Persistent Memory Analysis

### Current Flow
1. User sends message in `/api/chat`.
2. `backend/services/memory/memory_extractor.py`:
   - Runs regex rules on `user_message` detecting instructions, preferred names, explanation styles, weak topics, study goals, target subjects, and academic majors.
3. `profile_service.save_user_memory`:
   - Upserts into `user_memory` (max 20 memories per user).
4. `summary_service.maybe_update_conversation_summary`:
   - If message count > 20, summarizes older messages using LLM and updates `conversations.summary`.
5. `context_builder.build_ai_context`:
   - Injects: System Prompt + Active User Memories + Conversation Summary + 10 Recent Messages + Current Question.

### Worker Compatibility
- **100% Compatible**. The regex extraction logic, prompt composition, and summary triggers require zero Python-specific libraries. In TypeScript/JS, this is under 150 lines of clear, maintainable code running directly against Cloudflare D1.

---

## 10. PDF / Document Processing Analysis

- **Current Behavior**:
  - Handled on Flask backend via `POST /api/upload-pdf` with PyMuPDF (`import fitz`).
  - Encrypted PDFs are handled with `doc.authenticate("")`.
  - Max text capped at 15,000 characters.
  - Sub-actions: `action="summarize"`, `action="flashcards"`, `action="index"`.
- **Worker Solution**:
  - Use `unpdf` (powered by Mozilla PDF.js compiled for WebAssembly/Workers) to parse `file_bytes` directly from `multipart/form-data`.
  - Pass extracted text directly to the summarization, flashcard, or chunking functions.

---

## 11. Heavy Dependency Analysis

| Dependency | Purpose | Current Usage | Worker Compatible? | Proposed Replacement |
| :--- | :--- | :--- | :--- | :--- |
| `torch` | Deep learning runtime | Fallback models & sentence-transformers | **NO** | Remove entirely; utilize cloud AI APIs & Cloudflare Workers AI. |
| `transformers` | Hugging Face pipeline | T5 QG, BART summarizer, DistilBERT QA | **NO** | Remove; fallback between Gemini, Nemotron, GLM. |
| `sentence-transformers` | Neural embeddings | `all-MiniLM-L6-v2` in `rag_engine.py` | **NO** | Cloudflare Workers AI (`@cf/baai/bge-base-en-v1.5`) or Gemini Embeddings. |
| `faiss-cpu` | Vector similarity | `faiss.IndexFlatL2` in `rag_engine.py` | **NO** | In-Worker vector dot-product/cosine similarity or Cloudflare Vectorize. |
| `pymupdf` (`fitz`) | PDF text parsing | `app.py` upload & indexing | **NO** | `unpdf` (Wasm PDF parser for Workers) or client-side PDF.js. |
| `scikit-learn` | TF-IDF fallback | `TfidfVectorizer`, `cosine_similarity` | **NO** | Lightweight pure-JS cosine similarity function. |
| `beautifulsoup4` | Web scraping | `extract_text_from_url` in `/api/summarize` | **NO** | Native Cloudflare `HTMLRewriter` or standard regex tag stripper. |
| `firebase-admin` | Token verification | `auth/firebase_auth.py` | **NO** | Web Crypto API / `jose` library verifying Google public JWKS. |
| `flask` / `gunicorn` | HTTP server & WSGI | Application routing | **NO** | **Hono** framework on Cloudflare Workers. |

---

## 12. Security Findings

1. **Client Firebase Keys**: `frontend/src/config/firebase.js` contains default fallback values for Firebase client configuration (`apiKey`, `authDomain`, `projectId`, etc.).
   - *Status*: Standard practice for Firebase client SDKs, but best practice is to require `VITE_FIREBASE_*` in Cloudflare Pages environment settings.
2. **Server Secrets Isolation**:
   - `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `GLM_API_KEY`, and `SECRET_KEY` are kept server-side in `backend/config.py`.
   - In Cloudflare, these will be securely bound as **Worker Secrets** via `wrangler secret put` or Cloudflare Dashboard.
3. **CORS Hardening**:
   - Current Flask implementation dynamically validates `FRONTEND_URL`.
   - On Workers, Hono's `cors()` middleware will strictly allow the Cloudflare Pages origin (e.g. `https://study-buddy.pages.dev`).
4. **Rate Limiting**:
   - Flask uses `Flask-Limiter` with in-memory storage (which caused startup warnings).
   - In Cloudflare, rate limiting can be handled using Cloudflare's native Edge Rate Limiting or KV counter.

---

## 13. Cloudflare Compatibility Matrix

| Component | Current Technology | Cloudflare Compatible? | Migration Required | Proposed Approach |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 | **Yes** | Minor (Add `_redirects`) | Deploy build output (`frontend/dist`) to **Cloudflare Pages**. |
| **Backend API** | Python / Flask | **No** | Full Rewrite of API layer | Re-implement API routes in TypeScript using **Hono** on **Cloudflare Workers**. |
| **Database** | Embedded SQLite (`study_buddy.db`)| **Yes** | Minimal (Schema identical) | Migrate tables and seed data to **Cloudflare D1**. |
| **Auth Verification**| `firebase-admin` (Python) | **No** | Replace verification logic | Use Web Crypto / `jose` to verify Firebase ID tokens against Google JWKS. |
| **AI LLM Routing** | `factory.py` + `requests` | **Yes** | Fetch-based adaptation | Direct HTTPS `fetch` calls to Gemini REST API and OpenRouter. |
| **AI Fallbacks** | Local Hugging Face models | **No** | Remove local models | Multi-provider fallback chain across external APIs + Workers AI. |
| **PDF Extraction** | PyMuPDF (`fitz`) | **No** | Replace parser | Use WebAssembly `unpdf` library inside Cloudflare Worker. |
| **Vector Search** | FAISS + SentenceTransformers | **No** | Replace vector engine | Workers AI embeddings + Float32Array cosine similarity in D1. |
| **Persistent Memory**| Regex + SQLite CRUD | **Yes** | Transcribe to TypeScript | Standard SQL queries executed against D1 bindings. |
| **Web Summarizer** | BeautifulSoup4 | **No** | Replace HTML parser | Standard fetch + Cloudflare `HTMLRewriter` to extract article text. |

---

## 14. Proposed Target Architecture

```text
                                 [ User Client ]
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
           (Static SPA Delivery)                    (API Requests + Auth)
                    ▼                                       ▼
       [ Cloudflare Pages ]                        [ Cloudflare Worker ]
    (React 19, Vite, Tailwind)                  (Hono API Framework at Edge)
                    │                                       │
                    │                                       ├── [ Google Public JWKS ]
                    │                                       │   (Verify Firebase JWT)
                    │                                       │
                    ▼                                       ├── [ Cloudflare D1 ]
       [ Firebase Client SDK ]                              │   (Users, Convs, Msgs, Memory)
    (Google / Email / GitHub Auth)                          │
                                                            ├── [ Google Gemini REST API ]
                                                            │   (Gemini 1.5/2.0 Flash, Vision)
                                                            │
                                                            ├── [ OpenRouter REST API ]
                                                            │   (Nemotron, GLM, Llama)
                                                            │
                                                            └── [ Cloudflare Workers AI ]
                                                                (bge-base-en embeddings)
```

---

## 15. Proposed D1 Schema

This schema is 100% compatible with the existing SQLite queries while adding indexes for high performance at edge scale:

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT UNIQUE NOT NULL,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '',
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, id ASC);

-- 4. User Memory Table (Persistent AI Learning Profile)
CREATE TABLE IF NOT EXISTS user_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    memory_type TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memory_lookup ON user_memory(user_id, memory_type, memory_key);

-- 5. PDF Documents & Chunks Table (Stateless Edge RAG)
CREATE TABLE IF NOT EXISTS pdf_documents (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    filename TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pdf_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT, -- JSON array of floats for cosine similarity
    FOREIGN KEY(document_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_doc ON pdf_chunks(document_id);
```

---

## 16. Proposed Repository Structure

```text
Study_Buddy/
│
├── frontend/                              # Cloudflare Pages Target
│   ├── public/
│   │   ├── _redirects                     # SPA catch-all rewrite: /* /index.html 200
│   │   └── open-book.png
│   ├── src/
│   │   ├── api/                           # Axios pointing to Cloudflare Worker
│   │   ├── components/
│   │   ├── config/firebase.js
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── worker/                                # Cloudflare Worker Target
│   ├── src/
│   │   ├── index.ts                       # Hono application router & CORS
│   │   ├── middleware/
│   │   │   └── auth.ts                    # Firebase JWKS ID token verifier & user sync
│   │   ├── db/
│   │   │   ├── schema.sql                 # D1 database schema
│   │   │   └── queries.ts                 # D1 query helpers
│   │   ├── services/
│   │   │   ├── memory.ts                  # Regex memory extractor & profile builder
│   │   │   ├── rag.ts                     # unpdf parser & vector similarity search
│   │   │   └── ai.ts                      # Multi-provider LLM caller (Gemini & OpenRouter)
│   │   └── prompts/                       # Modular prompts (chat, flashcards, research, etc.)
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.toml                      # Cloudflare Worker, D1, & AI bindings
│
├── backend/                               # Retained as standalone reference or fallback
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
│
├── .github/workflows/
├── .gitignore
├── README.md
└── LICENSE
```

---

## 17. Environment Variable Plan

### Frontend / Public Variables (Configured in Cloudflare Pages)
```env
VITE_API_BASE_URL=https://study-buddy-api.your-subdomain.workers.dev
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=studyassistant-26fb6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studyassistant-26fb6
VITE_FIREBASE_STORAGE_BUCKET=studyassistant-26fb6.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1047865212331
VITE_FIREBASE_APP_ID=1:1047865212331:web:37cd51aa786bc05cee66ee
VITE_FIREBASE_MEASUREMENT_ID=G-QF9RTVB2K5
```

### Worker / Secret Variables (Bound via `wrangler secret put`)
```env
# AI Provider Keys
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1-...
NVIDIA_API_KEY=sk-or-v1-...
GLM_API_KEY=sk-or-v1-...

# CORS Allowed Origin
FRONTEND_URL=https://study-buddy.pages.dev

# Firebase Verification Project ID
FIREBASE_PROJECT_ID=studyassistant-26fb6
```

---

## 18. Deployment Plan

### Step 1: Cloudflare D1 Database Provisioning
```bash
wrangler d1 create study-buddy-db
wrangler d1 execute study-buddy-db --file=./worker/src/db/schema.sql
```

### Step 2: Cloudflare Worker Deployment
```bash
cd worker
npm install
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put FRONTEND_URL
wrangler deploy
```

### Step 3: Cloudflare Pages Deployment
- Connect GitHub repository in Cloudflare Pages dashboard.
- Set **Build command**: `npm run build`
- Set **Build output directory**: `dist`
- Set **Root directory**: `frontend`
- Add environment variables (`VITE_API_BASE_URL`, `VITE_FIREBASE_*`).

---

## 19. Migration Phases

- **PHASE 1: Repository and Architecture Audit** *(Current task)*.
- **PHASE 2: Worker Foundation & Hono API Setup** (Setup TypeScript Worker, routing, CORS, and health checks).
- **PHASE 3: Cloudflare D1 Database Migration** (Define migrations and D1 query abstraction).
- **PHASE 4: Firebase Authentication on Worker** (Implement Google JWKS token verification and user sync in D1).
- **PHASE 5: External AI Provider Migration** (HTTPS REST implementations for Gemini, Nemotron, GLM with fallback).
- **PHASE 6: Persistent AI Memory Migration** (Port regex extractor, context builder, and conversation management).
- **PHASE 7: Stateless Document RAG Migration** (`unpdf` parser + embedding generation + cosine similarity in D1).
- **PHASE 8: Frontend API Re-Targeting** (Add `_redirects` and verify dynamic `VITE_API_BASE_URL` routing).
- **PHASE 9: Cloudflare Pages & Worker Production Deployment**.
- **PHASE 10: End-to-End Verification & Documentation**.

---

## 20. Risks and Blockers

| Risk / Blocker | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Worker Script Size Limit** (Free tier: 1 MB compressed / 10 MB paid) | High | Do NOT bundle heavy libraries or ML models. Use Hono + `unpdf` + lightweight `jose`. |
| **Worker CPU Execution Time Limit** (Free tier: 10 ms CPU time, 30s wall time) | Medium | HTTPS calls to AI APIs count toward wall time (I/O), not CPU time. CPU stays under 3 ms. |
| **Large PDF Memory Consumption** | Medium | Limit uploaded PDF parsing to max 10 MB and truncate text to 20,000 words. |
| **CORS Edge Preflight Failures** | Low | Implement Hono's standard `cors()` middleware allowing explicit Pages domains. |

---

## 21. Features Requiring Architectural Changes

1. **PDF RAG Storage**:
   - *Current*: Kept in an in-memory Python dictionary `pdf_rag_sessions = {}`.
   - *Change*: Store document metadata and chunk embeddings in **Cloudflare D1**.
2. **Local ML Models**:
   - *Current*: PyTorch T5, BART, and DistilBERT local fallbacks.
   - *Change*: Remove local models; use multi-provider API fallback (Gemini -> Nemotron -> GLM -> Workers AI).
3. **Firebase Admin SDK**:
   - *Current*: Python `firebase-admin` service account file / private key.
   - *Change*: Validate ID tokens against Google's public JWKS certificates using standard Web Crypto.

---

## 22. Recommended Migration Order

1. **Build `worker/` Foundation**: Hono server with `/api/health` and D1 schema.
2. **Implement Worker Authentication**: JWKS token verification with `GET /api/user/me`.
3. **Implement Conversation & Memory APIs**: Port `services/memory/` logic to TypeScript on D1.
4. **Implement Core AI Chat & Tools**: Connect Gemini & OpenRouter to `/api/chat`, `/api/flashcards`, `/api/research`, `/api/summarize`.
5. **Implement Edge PDF Processing**: Integrate `unpdf` and vector search for `/api/upload-pdf` and `/api/pdf-chat`.
6. **Connect & Deploy Frontend**: Add `_redirects` to `frontend/public/` and deploy to Cloudflare Pages.

---

## 23. Files That Will Need Modification

- `frontend/public/_redirects` *(New file for Pages SPA routing)*
- `frontend/src/api/axios.js` *(Minor verification of Base URL fallback)*
- `frontend/src/pages/Settings.jsx` *(API diagnostics endpoint display)*
- `.gitignore` *(Add `.wrangler/`)*
- `README.md` *(Document Cloudflare deployment)*

---

## 24. Files That Should NOT Be Modified

- `frontend/src/context/AuthContext.jsx` (Client-side Firebase auth is already working properly)
- `frontend/src/config/firebase.js` (Client Firebase configuration)
- `frontend/src/pages/*` (All UI page views, layouts, and styling remain untouched)
- `frontend/src/components/*` (All UI components, animations, and Tailwind styling remain untouched)
- `backend/*` (Preserved intact as a standalone Python reference backend)

---

## 25. Final Migration Checklist

- [ ] Complete Architecture & Compatibility Audit reviewed and approved.
- [ ] Initialize `worker/` with `wrangler.toml`, Hono, and TypeScript.
- [ ] Create Cloudflare D1 database and apply schema migrations.
- [ ] Implement Firebase ID token verification middleware using Google public JWKS.
- [ ] Implement user synchronization to Cloudflare D1.
- [ ] Implement persistent conversation and message CRUD routes.
- [ ] Port regex-based AI memory extractor and context builder.
- [ ] Implement AI providers (Gemini REST API & OpenRouter) with autonomous fallback.
- [ ] Implement PDF text extraction via WebAssembly (`unpdf`) and similarity retrieval.
- [ ] Verify CORS headers and rate limits.
- [ ] Configure `_redirects` in `frontend/public/` for Cloudflare Pages.
- [ ] Deploy Worker and bind D1 + Secrets (`wrangler deploy`).
- [ ] Deploy Frontend to Cloudflare Pages with `VITE_API_BASE_URL`.
- [ ] Run end-to-end integration tests (Auth, Chat, Memory, Flashcards, PDF, Visual QA).
