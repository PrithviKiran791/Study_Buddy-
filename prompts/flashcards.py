def get_flashcards_prompt(topic: str, count: int) -> str:
    return (
        f"Generate exactly {count} educational flashcards for: {topic}.\n\n"
        f"Return ONLY a valid, parseable JSON array of objects, where each object has 'question' and 'answer' keys. "
        f"Do NOT wrap the response in markdown code blocks (like ```json), and do NOT add any conversational prefix or suffix.\n\n"
        f"Format Example:\n"
        f"[{{\"question\": \"What is photosynthesis?\", \"answer\": \"The process by which plants use sunlight to synthesize nutrients from CO2 and water.\"}}]"
    )
