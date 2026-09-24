import json
import time
import requests
from typing import List, Dict, Tuple, Optional, Generator, Any
from ai.provider import BaseAIProvider
from prompts.chat import SYSTEM_INSTRUCTION
from prompts.research import get_research_prompt
from prompts.summary import get_summary_prompt
from prompts.flashcards import get_flashcards_prompt
from prompts.rag import get_pdf_chat_prompt, get_conversational_qa_prompt


class GemmaProvider(BaseAIProvider):
    """
    AI Provider wrapping Google's Gemma 4 model (google/gemma-4-26b-a4b-it)
    accessed via OpenRouter's OpenAI-compatible API.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: Optional[int] = None,
    ):
        import config

        self.api_key = (
            api_key if api_key is not None else getattr(config, "OPENROUTER_API_KEY", "")
        )
        if self.api_key:
            self.api_key = self.api_key.strip()
        else:
            self.api_key = ""

        self.model_name = (
            model_name
            or getattr(config, "OPENROUTER_MODEL", "")
            or "google/gemma-4-26b-a4b-it"
        ).strip()

        self.timeout = (
            timeout
            if timeout is not None
            else getattr(config, "OPENROUTER_TIMEOUT", 60)
        )
        self.endpoint = "https://openrouter.ai/api/v1/chat/completions"

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Study Assistant",
        }

    def _call_api(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> Any:
        if not self.api_key or any(
            self.api_key.lower().startswith(p)
            for p in ("your_", "replace_", "sk-your", "changeme")
        ):
            raise ValueError(
                "OPENROUTER_API_KEY is not set or invalid. Please configure OPENROUTER_API_KEY in backend/.env"
            )

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

        start_time = time.time()
        try:
            response = requests.post(
                self.endpoint,
                headers=self._get_headers(),
                json=payload,
                timeout=self.timeout,
                stream=stream,
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"OpenRouter request for model '{self.model_name}' timed out after {self.timeout}s."
            )
        except requests.exceptions.RequestException as req_err:
            raise RuntimeError(f"OpenRouter connection error: {req_err}")

        if response.status_code == 401:
            raise RuntimeError(
                "OpenRouter 401 Unauthorized: Invalid or expired OPENROUTER_API_KEY."
            )
        elif response.status_code == 402:
            raise RuntimeError(
                "OpenRouter 402 Insufficient Credits: Please top up your OpenRouter account balance."
            )
        elif response.status_code == 403:
            raise RuntimeError(
                "OpenRouter 403 Forbidden: Spend limit reached, API key disabled, or access blocked."
            )
        elif response.status_code == 404:
            raise RuntimeError(
                f"OpenRouter 404 Not Found: Model '{self.model_name}' is unavailable or invalid."
            )
        elif response.status_code == 429:
            raise RuntimeError(
                "OpenRouter 429 Rate Limit Exceeded: Upstream provider rate-limited. Retry with backoff."
            )
        elif response.status_code >= 500:
            raise RuntimeError(
                f"OpenRouter Upstream Failure ({response.status_code}): {response.text[:200]}"
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"OpenRouter API Error ({response.status_code}): {response.text[:200]}"
            )

        if stream:
            return self._stream_generator(response, start_time)

        try:
            data = response.json()
        except ValueError:
            raise RuntimeError(f"OpenRouter returned invalid JSON: {response.text[:200]}")

        if "error" in data:
            err = data["error"]
            err_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            raise RuntimeError(f"OpenRouter API Error: {err_msg}")

        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("OpenRouter returned empty choices in response.")

        msg = choices[0].get("message", {})
        content = msg.get("content")
        if not content:
            content = msg.get("reasoning", "") or ""

        elapsed = time.time() - start_time
        print(f"[OpenRouter Gemma 4] Response generated in {elapsed:.2f}s (model: {self.model_name})")
        return content.strip()

    def _stream_generator(
        self, response: requests.Response, start_time: float
    ) -> Generator[str, None, None]:
        first_chunk_received = False
        try:
            for line in response.iter_lines():
                if not line:
                    continue
                line_str = line.decode("utf-8").strip()
                if line_str.startswith("data: "):
                    data_str = line_str[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        choices = chunk.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content") or ""
                            if content:
                                if not first_chunk_received:
                                    ttfb = time.time() - start_time
                                    print(
                                        f"[OpenRouter Gemma 4 STREAM] Time-to-first-token (TTFT): {ttfb:.2f}s"
                                    )
                                    first_chunk_received = True
                                yield content
                    except json.JSONDecodeError:
                        continue
        finally:
            response.close()

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
            messages.append({"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"})

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

    def chat(
        self, message: str, history: List[Dict[str, any]]
    ) -> Tuple[str, List[Dict[str, any]]]:
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

    def stream_chat(
        self, message: str, history: List[Dict[str, any]], system_instruction: Optional[str] = None
    ) -> Generator[str, None, None]:
        sys_inst = system_instruction or SYSTEM_INSTRUCTION
        messages = [{"role": "system", "content": sys_inst}]
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "user" else "assistant"
                if msg.get("parts") and len(msg["parts"]) > 0:
                    content = msg["parts"][0]
                else:
                    content = msg.get("content", "")
                messages.append({"role": role, "content": str(content)})
        messages.append({"role": "user", "content": message})

        return self._call_api(messages, stream=True)

    def analyze_document(self, text: str, action: str = "summarize") -> str:
        if action == "summarize":
            return self.generate_summary(text)
        if action == "flashcards":
            return json.dumps(self.generate_flashcards(text, 5))
        raise ValueError("Invalid document action")

    def analyze_image(self, question: str, image_b64: str, mime_type: str) -> str:
        prompt = (
            f"You are an expert visual study assistant helping a student. "
            f"Carefully analyze the image and answer the following question in detail:\n\n"
            f"Question: {question}\n\n"
            f"If the image contains diagrams, charts, equations, or text, describe and explain them "
            f"as part of your answer. Be educational and thorough."
        )
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_b64}"},
                    },
                ],
            }
        ]
        return self._call_api(messages)
