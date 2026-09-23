import requests
import json
from typing import List, Dict, Tuple, Optional
from ai.provider import BaseAIProvider
from prompts.chat import SYSTEM_INSTRUCTION
from prompts.research import get_research_prompt
from prompts.summary import get_summary_prompt
from prompts.flashcards import get_flashcards_prompt
from prompts.rag import get_pdf_chat_prompt, get_conversational_qa_prompt


class NemotronProvider(BaseAIProvider):
    """AI Provider wrapping NVIDIA Nemotron models (OpenRouter or NVIDIA API Catalog)."""

    def __init__(self, api_key: str, model_name: str = "nvidia/nemotron-3.5-lightning:free"):
        self.api_key = (api_key or "").strip()
        self.model_name = model_name or "nvidia/nemotron-3.5-lightning:free"
        
        if self.api_key.startswith("sk-or-") or "/" in self.model_name:
            self.endpoint = "https://openrouter.ai/api/v1/chat/completions"
        else:
            self.endpoint = "https://integrate.api.nvidia.com/v1/chat/completions"

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
        if "openrouter.ai" in self.endpoint:
            headers["HTTP-Referer"] = "http://localhost:5173"
            headers["X-Title"] = "Study Assistant"

        payload = {
            "model": model_override or self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        response = requests.post(self.endpoint, headers=headers, json=payload, timeout=15)

        if response.status_code != 200:
            raise Exception(f"Nemotron API Error ({response.status_code}): {response.text}")

        data = response.json()
        if "error" in data:
            err = data["error"]
            err_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            raise Exception(f"Nemotron API Error: {err_msg}")

        choices = data.get("choices", [])
        if not choices:
            raise Exception(f"Nemotron API Error: No choices returned in response: {response.text}")

        msg = choices[0].get("message", {})
        content = msg.get("content")
        if not content:
            content = msg.get("reasoning", "") or ""

        return content.strip()

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
                role = "user" if msg.get("role") == "user" else "assistant"
                if msg.get("parts") and len(msg["parts"]) > 0:
                    content = msg["parts"][0]
                else:
                    content = msg.get("content", "")
                messages.append({"role": role, "content": str(content)})
            messages.append({"role": "user", "content": question})

        ans = self._call_api(messages)

        new_history = list(history) if history else []
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
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "user" else "assistant"
                if msg.get("parts") and len(msg["parts"]) > 0:
                    content = msg["parts"][0]
                else:
                    content = msg.get("content", "")
                messages.append({"role": role, "content": str(content)})
        messages.append({"role": "user", "content": message})

        ans = self._call_api(messages)

        new_history = list(history) if history else []
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
        prompt = (
            f"You are an expert visual assistant helping a student study. "
            f"Carefully analyse the image and answer the following question in detail:\n\n"
            f"Question: {question}\n\n"
            f"If the image contains diagrams, charts, equations, or text, describe and explain them "
            f"as part of your answer. Be educational and thorough."
        )
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_b64}"
                        }
                    }
                ]
            }
        ]
        return self._call_api(messages)
