import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
GLM_API_KEY = os.getenv("GLM_API_KEY")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemini").lower()

# Optional model overrides
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")
GLM_MODEL = os.getenv("GLM_MODEL", "glm-4")
GLM_VISION_MODEL = os.getenv("GLM_VISION_MODEL", "glm-4v")

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
        "gemini": {"configured": is_valid_api_key(GEMINI_API_KEY)},
        "nemotron": {"configured": is_valid_api_key(NVIDIA_API_KEY), "model": NVIDIA_MODEL},
        "glm": {"configured": is_valid_api_key(GLM_API_KEY), "model": GLM_MODEL},
    }
