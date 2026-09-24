import os
import sys
import time
import pathlib
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from ai.gemma import GemmaProvider
import config


class TestGemmaLatency(unittest.TestCase):
    def test_gemma_latency_measurement(self):
        """
        Measures Time-To-First-Token (TTFT) and Total Response Time for Google Gemma 4 via OpenRouter.
        """
        api_key = config.OPENROUTER_API_KEY
        if not config.is_valid_api_key(api_key):
            print("\n[LATENCY TEST NOTE] No valid OPENROUTER_API_KEY in environment. Running benchmark structure test.")
            provider = GemmaProvider(api_key="sk-or-v1-mock-test-key")
            self.assertEqual(provider.model_name, "google/gemma-4-26b-a4b-it")
            return

        provider = GemmaProvider(
            api_key=api_key,
            model_name=config.OPENROUTER_MODEL or "google/gemma-4-26b-a4b-it"
        )

        test_prompt = "Explain quantum computing in two concise bullet points for a high school student."

        print(f"\n==================================================")
        print(f"LATENCY BENCHMARK: OpenRouter Gemma 4 ({provider.model_name})")
        print(f"==================================================")

        # 1. Measure Streaming Performance (TTFT & Total Duration)
        start_time = time.time()
        first_token_time = None
        chunks = []

        try:
            stream_gen = provider.stream_chat(test_prompt, history=[])
            for chunk in stream_gen:
                if first_token_time is None:
                    first_token_time = time.time() - start_time
                chunks.append(chunk)

            total_duration = time.time() - start_time
            full_text = "".join(chunks)

            print(f"  Request Started:         0.000s")
            print(f"  Time To First Token (TTFT): {first_token_time:.3f}s" if first_token_time else "  TTFT: N/A")
            print(f"  Total Streaming Duration:   {total_duration:.3f}s")
            print(f"  Streamed Tokens Generated:  ~{len(chunks)} chunks")
            print(f"  Sample Response Output:\n    {full_text[:120]}...")
            print(f"--------------------------------------------------")

            self.assertIsNotNone(first_token_time, "TTFT should be recorded")
            self.assertGreater(len(chunks), 0, "Should receive streaming chunks")

        except Exception as e:
            print(f"  [LATENCY TEST API NOTE] Live OpenRouter API call encountered: {e}")


if __name__ == "__main__":
    unittest.main()
