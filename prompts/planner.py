def get_study_plan_prompt(syllabus: str, topics: str, start_date: str, deadline: str) -> str:
    topics_str = f" (Focus topics: {topics})" if topics else ""
    return (
        f"Create a detailed, highly structured daily or weekly study plan based on the following syllabus details:\n"
        f"Syllabus/Goals: {syllabus}{topics_str}\n"
        f"Timeline: From {start_date} to {deadline}.\n\n"
        f"Format the plan beautifully in Markdown with clear daily or weekly objectives, milestones, "
        f"rest days, and advice on how to study these subjects. Ensure it fits exactly within the dates provided."
    )
