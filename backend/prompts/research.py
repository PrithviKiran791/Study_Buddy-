def get_research_prompt(topic: str) -> str:
    return (
        f"Provide a comprehensive, detailed, and highly educational guide on: {topic}.\n\n"
        f"Structure the response carefully using GitHub-flavored Markdown. "
        f"Include clean headings, detailed explanations, bullet points, code blocks or mathematical formulas "
        f"if applicable, and practical examples to aid student retention. Ensure the tone is academic yet accessible."
    )
