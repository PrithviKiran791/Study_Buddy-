def get_question_gen_prompt(paragraph: str) -> str:
    return (
        f"Generate exactly 5 high-quality, relevant educational questions based strictly on the following text.\n"
        f"Return them as a clean plain text list with exactly one question per line without any numbers, letters, or bullet points.\n\n"
        f"Text:\n{paragraph}"
    )
