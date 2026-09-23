from typing import List, Dict, Tuple, Optional

class BaseAIProvider:
    """Base abstract interface that all LLM providers (Nemotron, GLM, Gemini) must implement."""
    
    def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """General text completion with optional system instructions."""
        raise NotImplementedError
        
    def generate_flashcards(self, topic: str, count: int) -> List[Dict[str, str]]:
        """Generates a list of flashcard objects: [{'question': '...', 'answer': '...'}]"""
        raise NotImplementedError
        
    def generate_summary(self, text: str) -> str:
        """Condenses paragraphs of text into a concise summary."""
        raise NotImplementedError
        
    def answer_question(self, context: str, question: str, history: List[Dict[str, any]]) -> Tuple[str, List[Dict[str, any]]]:
        """Context-based Q&A (tutor) with conversational history."""
        raise NotImplementedError
        
    def generate_research(self, topic: str) -> str:
        """Generates a structured research study guide in Markdown."""
        raise NotImplementedError
        
    def chat(self, message: str, history: List[Dict[str, any]]) -> Tuple[str, List[Dict[str, any]]]:
        """Friendly study partner conversational chat with history."""
        raise NotImplementedError
        
    def analyze_document(self, text: str, action: str = "summarize") -> str:
        """Summarizes or generates flashcards from an uploaded PDF text."""
        raise NotImplementedError
        
    def analyze_image(self, question: str, image_b64: str, mime_type: str) -> str:
        """Multimodal visual analysis of a study diagram/image."""
        raise NotImplementedError
