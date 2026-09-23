import os
import sqlite3
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=True)

# Database Configuration (supports Railway persistent volume e.g. /data/study_buddy.db)
DATABASE_FILE = os.getenv("DATABASE_FILE", "study_buddy.db")

def get_db_connection():
    """Return a connection to the configured SQLite database, auto-creating directory if necessary."""
    db_path = DATABASE_FILE
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GLM_API_KEY = os.getenv("GLM_API_KEY") or OPENROUTER_API_KEY
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "nemotron").lower()

# Optional model overrides
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
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
        "gemini": {"configured": is_valid_api_key(GEMINI_API_KEY), "model": GEMINI_MODEL},
        "nemotron": {"configured": is_valid_api_key(NVIDIA_API_KEY), "model": NVIDIA_MODEL},
        "glm": {"configured": is_valid_api_key(GLM_API_KEY), "model": GLM_MODEL},
    }
