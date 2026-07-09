import time
from ai.provider import BaseAIProvider
from ai.gemini import GeminiProvider
from ai.nemotron import NemotronProvider
from ai.glm import GLMProvider

_cached_providers = {}


def clear_provider_cache():
    """Reset cached provider instances (e.g. after .env changes)."""
    global _cached_providers
    _cached_providers = {}

VISION_METHODS = {"analyze_image"}


class FallbackProvider(BaseAIProvider):
    """Tries a prioritized list of providers sequentially, failing over on error."""

    def __init__(self, providers: list):
        if not providers:
            raise ValueError(
                "No LLM providers are configured. Add at least one valid API key to your .env file. "
                "See .env.example for GEMINI_API_KEY, NVIDIA_API_KEY, or GLM_API_KEY."
            )
        self.providers = providers

    def _execute_with_fallback(self, method_name: str, *args, **kwargs):
        errors = []
        for provider in self.providers:
            provider_name = provider.__class__.__name__
            start_time = time.time()
            try:
                print(f"[LLM] Attempting {provider_name} for '{method_name}'...")
                method = getattr(provider, method_name)
                result = method(*args, **kwargs)
                elapsed = time.time() - start_time
                print(f"[LLM] [SUCCESS] {provider_name} succeeded in {elapsed:.2f}s")
                return result
            except NotImplementedError as nie:
                elapsed = time.time() - start_time
                print(f"[LLM] [INFO] {provider_name} does not support '{method_name}': {nie}")
                errors.append(f"{provider_name} (NotImplemented): {nie}")
            except Exception as e:
                elapsed = time.time() - start_time
                print(f"[LLM] [ERROR] {provider_name} failed in {elapsed:.2f}s. Error: {e}")
                errors.append(f"{provider_name}: {e}")

        raise RuntimeError(
            "All LLM providers in the fallback chain failed.\nErrors:\n" + "\n".join(errors)
        )

    def generate_response(self, prompt: str, system_instruction: str = None) -> str:
        return self._execute_with_fallback("generate_response", prompt, system_instruction)

    def generate_flashcards(self, topic: str, count: int) -> list:
        return self._execute_with_fallback("generate_flashcards", topic, count)

    def generate_summary(self, text: str) -> str:
        return self._execute_with_fallback("generate_summary", text)

    def answer_question(self, context: str, question: str, history: list) -> tuple:
        return self._execute_with_fallback("answer_question", context, question, history)

    def generate_research(self, topic: str) -> str:
        return self._execute_with_fallback("generate_research", topic)

    def chat(self, message: str, history: list) -> tuple:
        return self._execute_with_fallback("chat", message, history)

    def analyze_document(self, text: str, action: str = "summarize") -> str:
        return self._execute_with_fallback("analyze_document", text, action)

    def analyze_image(self, question: str, image_b64: str, mime_type: str) -> str:
        return self._execute_with_fallback("analyze_image", question, image_b64, mime_type)


def _build_provider_cache():
    import config

    if "gemini" not in _cached_providers:
        _cached_providers["gemini"] = GeminiProvider(
            api_key=config.GEMINI_API_KEY,
            model_name=config.GEMINI_MODEL,
        )

    if "nemotron" not in _cached_providers:
        _cached_providers["nemotron"] = NemotronProvider(
            api_key=config.NVIDIA_API_KEY,
            model_name=config.NVIDIA_MODEL,
        )

    if "glm" not in _cached_providers:
        _cached_providers["glm"] = GLMProvider(
            api_key=config.GLM_API_KEY,
            model_name=config.GLM_MODEL,
            vision_model_name=config.GLM_VISION_MODEL,
        )


def _configured_providers(names: list) -> list:
    import config

    _build_provider_cache()
    configured = []
    for name in names:
        key_map = {"gemini": config.GEMINI_API_KEY, "nemotron": config.NVIDIA_API_KEY, "glm": config.GLM_API_KEY}
        if config.is_valid_api_key(key_map.get(name)):
            configured.append(_cached_providers[name])
    return configured


def _priority_order(default_model: str) -> list:
    if default_model == "nemotron":
        return ["nemotron", "glm", "gemini"]
    if default_model == "glm":
        return ["glm", "gemini", "nemotron"]
    return ["gemini", "nemotron", "glm"]


def get_llm_provider(capability: str = "text") -> BaseAIProvider:
    """
    Return a fallback provider chain.
    capability='vision' uses only vision-capable providers (Gemini, GLM).
    """
    import config

    if capability == "vision":
        order = ["gemini", "glm"]
    else:
        order = _priority_order(config.DEFAULT_MODEL)

    providers = _configured_providers(order)
    return FallbackProvider(providers)


def get_actionable_llm_error(error: Exception) -> str:
    """Convert provider errors into user-friendly guidance."""
    msg = str(error).lower()

    hints = []
    if "429" in str(error) or "quota" in msg:
        hints.append(
            "Gemini: Daily free-tier quota exceeded. Wait a few minutes and retry, "
            "or check usage at https://aistudio.google.com/"
        )
    elif "gemini" in msg and ("403" in msg or "denied" in msg):
        hints.append(
            "Gemini: Your API key was denied. Create a new key at https://aistudio.google.com/apikey "
            "and set GEMINI_API_KEY in .env."
        )
    if "glm" in msg and ("401" in msg or "过期" in str(error) or "token" in msg):
        hints.append(
            "GLM: Your token is expired or invalid. Generate a new key at https://open.bigmodel.cn/ "
            "and set GLM_API_KEY in .env."
        )
    if "nemotron" in msg or "nvidia" in msg:
        if "403" in msg or "401" in msg or "authorization" in msg:
            hints.append(
                "NVIDIA: API key rejected. Generate a new key at https://build.nvidia.com/ "
                "and set NVIDIA_MODEL=meta/llama-3.1-8b-instruct in .env."
            )
        elif "404" in msg:
            hints.append(
                "NVIDIA: Model not found. Set NVIDIA_MODEL=meta/llama-3.1-8b-instruct in .env."
            )

    if not hints:
        hints.append(
            "Configure at least one working provider in .env: GEMINI_API_KEY, GLM_API_KEY, or NVIDIA_API_KEY. "
            "Restart the server after updating."
        )

    return " ".join(hints)
