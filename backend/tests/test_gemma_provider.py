import sys
import pathlib
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from ai.gemma import GemmaProvider


class TestGemmaProvider(unittest.TestCase):
    def test_missing_api_key_raises_error(self):
        provider = GemmaProvider(api_key="")
        with self.assertRaises(ValueError):
            provider.generate_response("Hello")

    def test_placeholder_api_key_raises_error(self):
        provider = GemmaProvider(api_key="your_openrouter_key_here")
        with self.assertRaises(ValueError):
            provider.generate_response("Hello")

    def test_custom_model_configuration(self):
        provider = GemmaProvider(
            api_key="sk-or-v1-mock-test-key",
            model_name="google/gemma-4-26b-a4b-it",
            timeout=45,
        )
        self.assertEqual(provider.model_name, "google/gemma-4-26b-a4b-it")
        self.assertEqual(provider.timeout, 45)

    @patch("ai.gemma.requests.post")
    def test_non_streaming_chat_completion(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "gen-test-123",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Gemma 4 is active and ready to assist.",
                    }
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 15, "total_tokens": 25},
        }
        mock_post.return_value = mock_response

        provider = GemmaProvider(api_key="sk-or-v1-mock-test-key")
        result = provider.generate_response("What is Gemma 4?")
        self.assertEqual(result, "Gemma 4 is active and ready to assist.")

        # Verify request structure sent to OpenRouter API
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], "https://openrouter.ai/api/v1/chat/completions")
        self.assertEqual(kwargs["json"]["model"], "google/gemma-4-26b-a4b-it")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer sk-or-v1-mock-test-key")

    @patch("ai.gemma.requests.post")
    def test_streaming_chat_completion(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.iter_lines.return_value = [
            b'data: {"choices": [{"delta": {"content": "Hello"}}]}',
            b'data: {"choices": [{"delta": {"content": " World!"}}]}',
            b"data: [DONE]",
        ]
        mock_post.return_value = mock_response

        provider = GemmaProvider(api_key="sk-or-v1-mock-test-key")
        stream_gen = provider.stream_chat("Say hello", history=[])
        chunks = list(stream_gen)
        self.assertEqual("".join(chunks), "Hello World!")

    @patch("ai.gemma.requests.post")
    def test_http_401_unauthorized_error(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_post.return_value = mock_response

        provider = GemmaProvider(api_key="sk-or-v1-invalid-key")
        with self.assertRaises(RuntimeError) as ctx:
            provider.generate_response("Test prompt")
        self.assertIn("401 Unauthorized", str(ctx.exception))

    @patch("ai.gemma.requests.post")
    def test_http_429_rate_limit_error(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = "Rate limit reached"
        mock_post.return_value = mock_response

        provider = GemmaProvider(api_key="sk-or-v1-mock-key")
        with self.assertRaises(RuntimeError) as ctx:
            provider.generate_response("Test prompt")
        self.assertIn("429 Rate Limit Exceeded", str(ctx.exception))

    @patch("ai.gemma.requests.post")
    def test_flashcards_generation_parsing(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        json_content = (
            '```json\n[{"question": "What is 2+2?", "answer": "4"}]\n```'
        )
        mock_response.json.return_value = {
            "choices": [{"message": {"role": "assistant", "content": json_content}}]
        }
        mock_post.return_value = mock_response

        provider = GemmaProvider(api_key="sk-or-v1-mock-key")
        cards = provider.generate_flashcards("Math", 1)
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["question"], "What is 2+2?")
        self.assertEqual(cards[0]["answer"], "4")


if __name__ == "__main__":
    unittest.main()
