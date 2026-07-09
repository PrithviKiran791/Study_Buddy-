import google.generativeai as genai
import json
import re
from typing import List, Dict, Tuple, Optional, Any
from ai.provider import BaseAIProvider
from prompts.chat import SYSTEM_INSTRUCTION
from prompts.research import get_research_prompt
from prompts.summary import get_summary_prompt
from prompts.flashcards import get_flashcards_prompt
from prompts.rag import get_pdf_chat_prompt, get_conversational_qa_prompt

# Models accessible on the free tier for most API keys (2.5+ often returns 403)
DEFAULT_MODEL_CHAIN = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite-001",
]


class GeminiProvider(BaseAIProvider):
    """AI Provider wrapping Google's Gemini models using the google-generativeai SDK."""

    def __init__(self, api_key: str, model_name: str = None):
        self.api_key = api_key
        if self.api_key:
            genai.configure(api_key=self.api_key)
        self._preferred_model = model_name
        self._model_chain = (
            [model_name] + [m for m in DEFAULT_MODEL_CHAIN if m != model_name]
            if model_name
            else list(DEFAULT_MODEL_CHAIN)
        )
        self._active_model = self._model_chain[0]

    def _is_quota_error(self, error: Exception) -> bool:
        return "429" in str(error) or "quota" in str(error).lower()

    def _is_access_denied(self, error: Exception) -> bool:
        msg = str(error).lower()
        return "403" in msg or "denied" in msg

    def _generate_with_fallback(
        self,
        content: Any,
        system_instruction: Optional[str] = None,
        generation_config: Optional[dict] = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set.")

        errors = []
        quota_hit = False

        for model_name in self._model_chain:
            try:
                model = (
                    genai.GenerativeModel(model_name, system_instruction=system_instruction)
                    if system_instruction
                    else genai.GenerativeModel(model_name)
                )
                kwargs = {}
                if generation_config:
                    kwargs["generation_config"] = generation_config
                response = model.generate_content(content, **kwargs)
                self._active_model = model_name
                return response.text
            except Exception as e:
                if self._is_quota_error(e):
                    quota_hit = True
                if self._is_access_denied(e):
                    errors.append(f"{model_name}: access denied")
                    continue
                errors.append(f"{model_name}: {e}")

        if quota_hit:
            raise RuntimeError(
                "Gemini API quota exceeded. Free-tier daily limits may be used up. "
                "Wait and retry later, or check usage at https://aistudio.google.com/"
            )

        raise RuntimeError(
            "All Gemini models failed. "
            + ("; ".join(errors) if errors else "Check your GEMINI_API_KEY at https://aistudio.google.com/apikey")
        )

    def _chat_with_fallback(
        self,
        message: str,
        history: List[Dict[str, any]],
        system_instruction: Optional[str] = None,
    ) -> Tuple[str, List[Dict[str, any]]]:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set.")

        errors = []
        quota_hit = False

        for model_name in self._model_chain:
            try:
                model = (
                    genai.GenerativeModel(model_name, system_instruction=system_instruction)
                    if system_instruction
                    else genai.GenerativeModel(model_name)
                )

                if not history:
                    chat_session = model.start_chat(history=[])
                    response = chat_session.send_message(message)
                    new_history = [
                        {"role": "user", "parts": [message]},
                        {"role": "model", "parts": [response.text]},
                    ]
                else:
                    formatted_history = [
                        {"role": msg["role"], "parts": [{"text": msg["parts"][0]}]}
                        for msg in history
                    ]
                    chat_session = model.start_chat(history=formatted_history)
                    response = chat_session.send_message(message)
                    new_history = list(history)
                    new_history.append({"role": "user", "parts": [message]})
                    new_history.append({"role": "model", "parts": [response.text]})

                self._active_model = model_name
                return response.text, new_history
            except Exception as e:
                if self._is_quota_error(e):
                    quota_hit = True
                if self._is_access_denied(e):
                    errors.append(f"{model_name}: access denied")
                    continue
                errors.append(f"{model_name}: {e}")

        if quota_hit:
            raise RuntimeError(
                "Gemini API quota exceeded. Free-tier daily limits may be used up. "
                "Wait and retry later, or check usage at https://aistudio.google.com/"
            )

        raise RuntimeError("All Gemini models failed. " + "; ".join(errors))

    def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        return self._generate_with_fallback(prompt, system_instruction=system_instruction)

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
        if not history:
            prompt = get_conversational_qa_prompt(context, question)
            answer = self._generate_with_fallback(prompt)
            new_history = [
                {"role": "user", "parts": [prompt]},
                {"role": "model", "parts": [answer]},
            ]
            return answer, new_history

        combined = f"Context:\n{context}\n\nQuestion: {question}"
        return self._chat_with_fallback(combined, history)

    def generate_research(self, topic: str) -> str:
        prompt = get_research_prompt(topic)
        return self.generate_response(prompt)

    def chat(self, message: str, history: List[Dict[str, any]]) -> Tuple[str, List[Dict[str, any]]]:
        if not history:
            prompt = f"{SYSTEM_INSTRUCTION}\n\nStudent: {message}"
            answer = self._generate_with_fallback(prompt, system_instruction=SYSTEM_INSTRUCTION)
            new_history = [
                {"role": "user", "parts": [message]},
                {"role": "model", "parts": [answer]},
            ]
            return answer, new_history

        return self._chat_with_fallback(message, history, system_instruction=SYSTEM_INSTRUCTION)

    def analyze_document(self, text: str, action: str = "summarize") -> str:
        if action == "summarize":
            return self.generate_summary(text)
        if action == "flashcards":
            return json.dumps(self.generate_flashcards(text, 5))
        raise ValueError("Invalid document action")

    def analyze_image(self, question: str, image_b64: str, mime_type: str) -> str:
        image_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": image_b64,
            }
        }
        prompt_parts = [
            image_part,
            {
                "text": (
                    f"You are an expert visual assistant helping a student study. "
                    f"Carefully analyse the image and answer the following question in detail:\n\n"
                    f"Question: {question}\n\n"
                    f"If the image contains diagrams, charts, equations, or text, describe and explain them "
                    f"as part of your answer. Be educational and thorough."
                )
            },
        ]
        return self._generate_with_fallback(prompt_parts)
