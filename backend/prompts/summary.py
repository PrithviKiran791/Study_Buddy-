def get_summary_prompt(text: str) -> str:
    return (
        f"Summarize the following content in a few clear, concise sentences. "
        f"Use clean bullet points for key takeaways if helpful, and keep it digestible for quick revision:\n\n{text}"
    )
