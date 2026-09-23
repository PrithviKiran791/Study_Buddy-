import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from config import GEMINI_MODEL, NVIDIA_MODEL


def test_model_defaults_are_not_retired_values():
    assert GEMINI_MODEL not in {"gemini-2.0-flash", "gemini-2.0-flash-lite"}
    assert NVIDIA_MODEL not in {"meta/llama-3.1-8b-instruct", "meta/llama-3.3-70b-instruct"}


if __name__ == "__main__":
    test_model_defaults_are_not_retired_values()
    print("test_model_defaults_are_not_retired_values PASSED")

