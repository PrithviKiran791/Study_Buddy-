# Production Dockerfile for Study Buddy Flask Backend
FROM python:3.11-slim

# Prevent Python from writing pyc files to disk & buffer stdout/stderr for container logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    GUNICORN_WORKERS=2

# Install system dependencies required for FAISS, PyMuPDF, and PyTorch C++ bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create application work directory and persistent volume mount point
WORKDIR /app
RUN useradd -m -u 1000 appuser && \
    mkdir -p /data && \
    chown -R appuser:appuser /app /data

# Copy dependency manifest and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source files
COPY --chown=appuser:appuser . /app

# Switch to non-root user for security hardening
USER appuser

# Expose default port
EXPOSE 5000

# Health check using lightweight /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/health || exit 1

# Start Flask via production Gunicorn WSGI server
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
