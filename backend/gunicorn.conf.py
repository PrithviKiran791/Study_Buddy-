import os

# Dynamic binding for container platforms (Railway, Render, Fly.io, Cloud Run specify PORT)
port = os.getenv("PORT", "5000")
bind = f"0.0.0.0:{port}"

# Worker count (configurable via environment variable, defaults to 2 workers for low-RAM hosts)
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
worker_class = "sync"

# Extended timeout (120s) for heavy LLM inference and PyMuPDF/FAISS PDF processing
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
keepalive = 5

# Direct container logs to stdout / stderr
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")

# Disable preload_app so lazy-loaded HuggingFace models isolate properly per worker
preload_app = False
