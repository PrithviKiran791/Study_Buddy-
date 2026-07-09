from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, T5ForConditionalGeneration, T5Tokenizer, AutoModelForQuestionAnswering, AutoTokenizer
import textwrap
import json
import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import base64
from rag_engine import PDFRagSystem
import sqlite3
from ai.factory import get_llm_provider, get_actionable_llm_error, clear_provider_cache
import config

# Load environment variables (force override to ensure new keys in .env are always respected)
load_dotenv(override=True)
clear_provider_cache()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24))

# SQLite Database Setup
DATABASE_FILE = "study_buddy.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Log LLM provider configuration at startup
_provider_status = config.get_provider_status()
print("[LLM] Provider configuration:")
for name, info in _provider_status.items():
    if name == "default_model":
        print(f"  DEFAULT_MODEL={info}")
    else:
        status = "configured" if info.get("configured") else "MISSING/INVALID"
        model = info.get("model", "")
        suffix = f" (model: {model})" if model else ""
        print(f"  {name}: {status}{suffix}")

_configured = sum(
    1 for k, v in _provider_status.items()
    if k != "default_model" and isinstance(v, dict) and v.get("configured")
)
if _configured == 0:
    print("[LLM] WARNING: No valid API keys found. AI features will fail until .env is configured.")

# Enable CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Setup rate limiting to prevent abuse
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["500 per day", "100 per hour"]
)

# Shared memory session stores for PDF system (in production, use Redis or SQLite)
pdf_rag_sessions = {}

# --- Lazy Loading for Hugging Face Models ---
_question_generator = None
_summarizer = None
_qa_pipeline = None

def get_question_generator():
    global _question_generator
    if _question_generator is None:
        print("[LOADING] Loading local Question Generator pipeline (this may take a moment)...")
        qg_tokenizer = T5Tokenizer.from_pretrained("valhalla/t5-base-qg-hl")
        qg_model = T5ForConditionalGeneration.from_pretrained("valhalla/t5-base-qg-hl")
        _question_generator = pipeline("text2text-generation", model=qg_model, tokenizer=qg_tokenizer)
        print("[OK] Question Generator pipeline loaded successfully.")
    return _question_generator

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        print("[LOADING] Loading local Summarizer pipeline (this may take a moment)...")
        _summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        print("[OK] Summarizer pipeline loaded successfully.")
    return _summarizer

def get_qa_pipeline():
    global _qa_pipeline
    if _qa_pipeline is None:
        print("[LOADING] Loading local QA pipeline (this may take a moment)...")
        qa_model = AutoModelForQuestionAnswering.from_pretrained("distilbert-base-uncased-distilled-squad")
        qa_tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-distilled-squad")
        _qa_pipeline = pipeline("question-answering", model=qa_model, tokenizer=qa_tokenizer)
        print("[OK] QA pipeline loaded successfully.")
    return _qa_pipeline

# --- Routes (REST API) ---

@app.route("/")
def home():
    return jsonify({"message": "AI Study Buddy API", "version": "2.0", "status": "running"})

@app.route("/api/health", methods=["GET"])
def health_check():
    status = config.get_provider_status()
    configured = [
        name for name, info in status.items()
        if name != "default_model" and isinstance(info, dict) and info.get("configured")
    ]
    return jsonify({
        "status": "healthy",
        "default_model": status["default_model"],
        "providers_configured": configured,
        "any_provider_ready": len(configured) > 0,
    })


@app.route("/api/llm/status", methods=["GET"])
def llm_status():
    return jsonify(config.get_provider_status())


# 1. Question Generator API
@app.route("/api/generate-questions", methods=["POST"])
def generate_questions():
    data = request.get_json()
    paragraph = data.get("paragraph", "").strip()
    
    if not paragraph:
        return jsonify({"error": "Please provide a paragraph"}), 400
    
    try:
        from prompts.questions import get_question_gen_prompt
        llm = get_llm_provider()
        prompt = get_question_gen_prompt(paragraph)
        res_text = llm.generate_response(prompt)
        # Parse questions, removing any leading list numbering
        questions = [line.strip().lstrip('0123456789.-* ') for line in res_text.split('\n') if line.strip()]
        return jsonify({"questions": questions, "input_paragraph": paragraph}), 200
    except Exception as llm_err:
        print(f"LLM Question Gen failed: {llm_err}. Trying local model fallback...")
        try:
            qg = get_question_generator()
            chunks = textwrap.wrap(paragraph, width=300)
            all_questions = []
            for chunk in chunks:
                input_text = f"generate questions: {chunk}"
                questions = qg(input_text, max_length=50, num_return_sequences=3, num_beams=5, batch_size=1)
                all_questions.extend(q["generated_text"] for q in questions)
            return jsonify({"questions": list(set(all_questions)), "input_paragraph": paragraph}), 200
        except Exception as e:
            return jsonify({"error": f"AI Error: {llm_err} (Fallback error: {e}). Please check your API keys."}), 500

# 2. Summarizer API (Enhanced for Text & Links)
def extract_text_from_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
        text = soup.get_text()
        # Break into lines and remove leading/trailing whitespace
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        return "\n".join(chunk for chunk in chunks if chunk)
    except Exception as e:
        return f"Error fetching URL: {e}"

@app.route("/api/summarize", methods=["POST"])
def summarize_text():
    data = request.get_json()
    user_text = data.get("text", "").strip()
    url = data.get("url", "").strip()
    
    content_to_summarize = ""
    
    if url:
        content_to_summarize = extract_text_from_url(url)
        if content_to_summarize.startswith("Error"):
            return jsonify({"error": content_to_summarize}), 400
    else:
        content_to_summarize = user_text
        
    if not content_to_summarize:
        return jsonify({"error": "Please provide text or a valid URL"}), 400

    try:
        llm = get_llm_provider()
        summary_text = llm.generate_summary(content_to_summarize[:10000])
        return jsonify({
            "summary": summary_text,
            "input_preview": content_to_summarize[:500] + ("..." if len(content_to_summarize) > 500 else "")
        }), 200
    except Exception as e:
        # Fallback to BART if LLM fails
        try:
            sb = get_summarizer()
            summary_text = sb(content_to_summarize[:1000], max_length=150, min_length=50, do_sample=False)[0]['summary_text']
            summary_text = "(Fallback Summary) " + summary_text
            return jsonify({
                "summary": summary_text,
                "input_preview": content_to_summarize[:500] + ("..." if len(content_to_summarize) > 500 else "")
            }), 200
        except Exception as fallback_err:
            return jsonify({"error": f"AI Error: {e} (Fallback error: {fallback_err})"}), 500

# 3. Question Answering API (Conversational Tutor)
@app.route("/api/answer-question", methods=["POST"])
def answer_question():
    data = request.get_json()
    context = data.get("context", "").strip()
    question = data.get("question", "").strip()
    history = data.get("history", [])
    
    if not context or not question:
        return jsonify({"error": "Please provide both context and question"}), 400
        
    try:
        llm = get_llm_provider()
        answer, history = llm.answer_question(context, question, history)
        return jsonify({"history": history, "answer": answer}), 200
        
    except Exception as llm_err:
        print(f"LLM QA failed: {llm_err}. Trying local model fallback...")
        try:
            qa = get_qa_pipeline()
            result = qa(question=question, context=context)
            answer = "(Fallback) " + result["answer"]
            history.append({"role": "user", "parts": [question]})
            history.append({"role": "model", "parts": [answer]})
            return jsonify({"history": history, "answer": answer}), 200
        except Exception as e:
            return jsonify({"error": f"AI Error: {llm_err} (Fallback error: {e})"}), 500

# 4. Study Plan Generator API
@app.route("/api/study-plan", methods=["POST"])
def study_plan():
    data = request.get_json()
    syllabus = data.get("syllabus", "")
    topics = data.get("topics", "")
    start_date = data.get("start_date", "")
    deadline = data.get("deadline", "")
    
    try:
        from prompts.planner import get_study_plan_prompt
        llm = get_llm_provider()
        prompt = get_study_plan_prompt(syllabus, topics, start_date, deadline)
        response_text = llm.generate_response(prompt)
        return jsonify({"study_plan": response_text}), 200
    except Exception as e:
        return jsonify({"error": f"AI Error: {e}"}), 500

# 5. Topic Researcher API
@app.route("/api/research", methods=["POST"])
def research():
    data = request.get_json()
    topic = data.get("topic", "").strip()
    if not topic:
        return jsonify({"error": "Please enter a topic"}), 400
    try:
        llm = get_llm_provider()
        content = llm.generate_research(topic)
        return jsonify({"topic": topic, "content": content}), 200
    except Exception as e:
        hint = get_actionable_llm_error(e)
        return jsonify({"error": f"AI Error: {e}", "hint": hint}), 500

# Notes Generator API
@app.route("/api/generate-notes", methods=["POST"])
def generate_notes():
    data = request.get_json()
    topic = data.get("topic", "").strip()
    material = data.get("material", "").strip()
    if not topic:
        return jsonify({"error": "Please enter a topic"}), 400
    try:
        llm = get_llm_provider()
        prompt = f"Create comprehensive study notes about {topic}."
        if material:
            prompt += f" Use the following source material:\n{material}"
        prompt += "\nFormat the output in clean, readable markdown with bullet points, sub-headings, and definitions of key terms."
        content = llm.generate_response(prompt)
        return jsonify({"topic": topic, "notes": content}), 200
    except Exception as e:
        return jsonify({"error": f"AI Error: {e}"}), 500

# 6. Web-Search QA API
@app.route("/api/web-search", methods=["POST"])
def web_search():
    data = request.get_json()
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "Please enter a question"}), 400
    try:
        llm = get_llm_provider()
        prompt = f"Search and answer: {question}. Provide a detailed, educational response with examples."
        response_text = llm.generate_response(prompt)
        return jsonify({"question": question, "answer": response_text}), 200
    except Exception as e:
        return jsonify({"error": f"AI Error: {e}"}), 500

# 7. Flashcards API
@app.route("/api/flashcards", methods=["POST"])
def flashcards():
    data = request.get_json()
    topic = data.get("topic", "").strip()
    count = data.get("count", 5)
    
    if not topic:
        return jsonify({"error": "Please enter a topic"}), 400
        
    try:
        llm = get_llm_provider()
        cards = llm.generate_flashcards(topic, count)
        return jsonify({"topic": topic, "cards": cards}), 200
    except Exception as e:
        return jsonify({"error": f"AI Error: {e}"}), 500

# 8. PDF Upload & Processing API
@app.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    if "pdf_file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files["pdf_file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a valid PDF file"}), 400
        
    action = request.form.get("action", "index")  # index, summarize, flashcards
    
    try:
        import fitz  # PyMuPDF
        file_bytes = file.read()
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        extracted_text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            extracted_text += page.get_text()
            
        if not extracted_text.strip():
            return jsonify({"error": "Could not extract text. The PDF might be scanned or empty."}), 400
            
        # Truncate to reasonable length to avoid token limits
        extracted_text = extracted_text[:15000]
            
        if action == "summarize":
            llm = get_llm_provider()
            summary_text = llm.generate_summary(extracted_text)
            return jsonify({
                "summary": summary_text,
                "input_preview": extracted_text[:500] + "..."
            }), 200
            
        elif action == "flashcards":
            llm = get_llm_provider()
            cards = llm.generate_flashcards(extracted_text[:5000], 5)
            return jsonify({"topic": file.filename, "cards": cards}), 200
            
        elif action == "index":
            # Create RAG system for this PDF
            session_id = os.urandom(16).hex()
            rag_system = PDFRagSystem()
            success = rag_system.process_pdf(file_bytes)
            
            if not success:
                return jsonify({"error": "Failed to process PDF for indexing"}), 500
                
            pdf_rag_sessions[session_id] = rag_system
            
            return jsonify({
                "session_id": session_id,
                "message": "PDF processed and indexed successfully",
                "preview": extracted_text[:500] + "..."
            }), 200
            
    except ImportError:
        return jsonify({"error": "PyMuPDF is not installed"}), 500
    except Exception as e:
        return jsonify({"error": f"Error processing PDF: {e}"}), 500

# 9. PDF Chat API (RAG-based)
@app.route("/api/pdf-chat", methods=["POST"])
def pdf_chat():
    data = request.get_json()
    session_id = data.get("session_id", "")
    question = data.get("question", "").strip()
    
    if not session_id or session_id not in pdf_rag_sessions:
        return jsonify({"error": "Invalid or expired session. Please upload a PDF first."}), 400
        
    if not question:
        return jsonify({"error": "Please provide a question"}), 400
        
    try:
        rag_system = pdf_rag_sessions[session_id]
        context = rag_system.retrieve_context(question, top_k=3)
        
        from prompts.rag import get_pdf_chat_prompt
        llm = get_llm_provider()
        prompt = get_pdf_chat_prompt(context, question)
        answer = llm.generate_response(prompt)
        
        return jsonify({
            "answer": answer,
            "context_preview": context[:300] + "..." if len(context) > 300 else context
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error: {e}"}), 500

# 10. Visual Question Answering API
@app.route("/api/visual-qa", methods=["POST"])
def visual_qa():
    question = request.form.get("question", "").strip()
    image_file = request.files.get("image")

    # Validation
    if not image_file or image_file.filename == "":
        return jsonify({"error": "Please upload an image"}), 400
    if not question:
        return jsonify({"error": "Please enter a question about the image"}), 400

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if image_file.mimetype not in allowed_types:
        return jsonify({"error": "Unsupported file type. Please upload JPEG, PNG, WEBP, or GIF"}), 400

    # Read & encode image
    try:
        image_bytes = image_file.read()
        image_b64   = base64.b64encode(image_bytes).decode("utf-8")
        mime_type   = image_file.mimetype
    except Exception as e:
        return jsonify({"error": f"Could not read image: {e}"}), 400

    # Send to LLM Provider (vision-capable chain: Gemini → GLM)
    try:
        llm = get_llm_provider(capability="vision")
        answer = llm.analyze_image(question, image_b64, mime_type)

        return jsonify({
            "question": question,
            "answer": answer,
            "image_data": f"data:{mime_type};base64,{image_b64}"
        }), 200

    except Exception as e:
        hint = get_actionable_llm_error(e)
        return jsonify({"error": f"Gemini Vision Error: {e}", "hint": hint}), 500

# 11. General Chatbot API
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "").strip()
    history = data.get("history", [])
    
    if not message:
        return jsonify({"error": "Please provide a message"}), 400
        
    try:
        llm = get_llm_provider()
        answer, history = llm.chat(message, history)
        return jsonify({"history": history, "answer": answer}), 200
        
    except Exception as e:
        hint = get_actionable_llm_error(e)
        return jsonify({"error": f"AI Error: {e}", "hint": hint}), 500

if __name__ == "__main__":
    # Binding to 0.0.0.0 is robust for both IPv4 and IPv6 connections on local networks/machines
    app.run(host="0.0.0.0", port=5000, debug=True)
