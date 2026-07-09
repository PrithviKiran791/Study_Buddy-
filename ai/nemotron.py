import requests
import json
from typing import List, Dict, Tuple, Optional
from ai.provider import BaseAIProvider
from prompts.chat import SYSTEM_INSTRUCTION
from prompts.research import get_research_prompt
from prompts.summary import get_summary_prompt
from prompts.flashcards import get_flashcards_prompt
from prompts.rag import get_pdf_chat_prompt, get_conversational_qa_prompt

# Models verified on NVIDIA API Catalog free tier
DEFAULT_MODEL_CHAIN = [
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.3-70b-instruct",
    "nvidia/nemotron-4-340b-instruct",
    "mistralai/mistral-7b-instruct-v2.0",
]


class NemotronProvider(BaseAIProvider):
    """AI Provider wrapping NVIDIA API Catalog models."""

    def __init__(self, api_key: str, model_name: str = "meta/llama-3.1-8b-instruct"):
        self.api_key = api_key
        self.endpoint = "https://integrate.api.nvidia.com/v1/chat/completions"
        self._model_chain = (
            [model_name] + [m for m in DEFAULT_MODEL_CHAIN if m != model_name]
            if model_name
            else list(DEFAULT_MODEL_CHAIN)
        )
        self.model_name = self._model_chain[0]

    def _call_api(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        model_override: Optional[str] = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("NVIDIA_API_KEY is not set.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        models_to_try = [model_override] if model_override else self._model_chain
        errors = []

        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            try:
                response = requests.post(
                    self.endpoint, headers=headers, json=payload, timeout=60
                )

                if response.status_code == 200:
                    data = response.json()
                    self.model_name = model_name
                    return data["choices"][0]["message"]["content"]

                if response.status_code in (401, 403):
                    raise Exception(
                        f"NVIDIA API Error ({response.status_code}): {response.text}. "
                        "Generate a new key at https://build.nvidia.com/"
                    )

                errors.append(f"{model_name}: {response.status_code} {response.text[:120]}")
            except requests.RequestException as e:
                errors.append(f"{model_name}: {e}")

        raise Exception(
            "All NVIDIA models failed. " + ("; ".join(errors) if errors else "Check NVIDIA_API_KEY")
        )

    def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        return self._call_api(messages)

    def generate_flashcards(self, topic: str, count: int) -> List[Dict[str, str]]:
        prompt = get_flashcards_prompt(topic, count)
        res_text = self.generate_response(prompt)
        text = res_text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)

    def generate_summary(self, text: str) -> str:
        prompt = get_summary_prompt(text)
        return self.generate_response(prompt)

    def answer_question(
        self, context: str, question: str, history: List[Dict[str, any]]
    ) -> Tuple[str, List[Dict[str, any]]]:
        messages = []
        if not history:
            prompt = get_conversational_qa_prompt(context, question)
            messages.append({"role": "user", "content": prompt})
        else:
            for msg in history:
                role = "user" if msg["role"] == "user" else "assistant"
                content = msg["parts"][0]
                messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": question})

        ans = self._call_api(messages)

        new_history = list(history)
        if not history:
            new_history.append({"role": "user", "parts": [prompt]})
        else:
            new_history.append({"role": "user", "parts": [question]})
        new_history.append({"role": "model", "parts": [ans]})
        return ans, new_history

    def generate_research(self, topic: str) -> str:
        prompt = get_research_prompt(topic)
        return self.generate_response(prompt)

    def chat(self, message: str, history: List[Dict[str, any]]) -> Tuple[str, List[Dict[str, any]]]:
        messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
        if not history:
            messages.append({"role": "user", "content": message})
        else:
            for msg in history:
                role = "user" if msg["role"] == "user" else "assistant"
                content = msg["parts"][0]
                messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": message})

        ans = self._call_api(messages)

        new_history = list(history)
        new_history.append({"role": "user", "parts": [message]})
        new_history.append({"role": "model", "parts": [ans]})
        return ans, new_history

    def analyze_document(self, text: str, action: str = "summarize") -> str:
        if action == "summarize":
            return self.generate_summary(text)
        if action == "flashcards":
            return json.dumps(self.generate_flashcards(text, 5))
        raise ValueError("Invalid document action")

    def analyze_image(self, question: str, image_b64: str, mime_type: str) -> str:
        raise NotImplementedError(
            "NVIDIA models do not support vision processing natively. Failover triggered."
        )
