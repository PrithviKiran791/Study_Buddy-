import os
import sys
import sqlite3
from typing import Optional
from dotenv import load_dotenv

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Load environment variables: check backend/.env first, then root .env
_backend_env = os.path.join(BACKEND_DIR, ".env")
_root_env = os.path.join(os.path.dirname(BACKEND_DIR), ".env")
if os.path.exists(_backend_env):
    load_dotenv(_backend_env, override=True)
elif os.path.exists(_root_env):
    load_dotenv(_root_env, override=True)
else:
    load_dotenv(override=True)

# Database Configuration (supports Railway persistent volume e.g. /data/study_buddy.db)
_DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "study_buddy.db")
DATABASE_FILE = os.getenv("DATABASE_FILE", _DEFAULT_DB_PATH)

def get_db_connection():
    """Return a connection to the configured SQLite database, auto-creating directory if necessary."""
    db_path = DATABASE_FILE
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it").strip()
OPENROUTER_TIMEOUT = int(os.getenv("OPENROUTER_TIMEOUT", "60"))
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "").strip()
GLM_API_KEY = (os.getenv("GLM_API_KEY") or OPENROUTER_API_KEY).strip()
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemma").lower()

# Model options
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "nvidia/nemotron-3.5-lightning:free")
GLM_MODEL = os.getenv("GLM_MODEL", "z-ai/glm-5.2:free")
GLM_VISION_MODEL = os.getenv("GLM_VISION_MODEL", "z-ai/glm-5.2:free")

PLACEHOLDER_PREFIXES = ("your_", "sk-your", "replace_", "changeme")


def is_valid_api_key(key: Optional[str]) -> bool:
    """Return True if the key looks like a real credential, not a placeholder."""
    if not key or not key.strip():
        return False
    lowered = key.strip().lower()
    return not any(lowered.startswith(p) for p in PLACEHOLDER_PREFIXES)


def get_provider_status() -> dict:
    """Summarize which providers have keys configured."""
    return {
        "default_model": DEFAULT_MODEL,
        "gemma": {"configured": is_valid_api_key(OPENROUTER_API_KEY), "model": OPENROUTER_MODEL},
        "nemotron": {"configured": is_valid_api_key(NVIDIA_API_KEY), "model": NVIDIA_MODEL},
        "glm": {"configured": is_valid_api_key(GLM_API_KEY), "model": GLM_MODEL},
    }

