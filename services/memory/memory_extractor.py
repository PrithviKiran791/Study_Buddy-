import re
from services.memory.profile_service import save_user_memory

def extract_and_save_memories(user_id, user_message):
    """
    Evaluate user message for durable learning preferences, goals, weak topics, or profile facts.
    Saves memories to SQLite user_memory table and returns list of newly saved memories.
    """
    if not user_id or not user_message or len(user_message.strip()) < 4:
        return []

    text = user_message.lower().strip()
    saved = []

    # 1. Explicit Remember instruction: "remember that ...", "please remember ..."
    rem_match = re.search(r'(?:please\s+)?(?:remember|keep in mind|note)\s+(?:that\s+)?(.+)', text, re.IGNORECASE)
    if rem_match:
        val = rem_match.group(1).strip()
        if len(val) >= 4:
            save_user_memory(user_id, "instruction", "user_note", val.capitalize())
            saved.append({"type": "instruction", "key": "user_note", "value": val.capitalize()})

    # 2. Preferred Name: "my name is ...", "call me ..."
    name_match = re.search(r'(?:my name is|call me)\s+([a-zA-Z]{2,20})', text, re.IGNORECASE)
    if name_match:
        name = name_match.group(1).strip().capitalize()
        save_user_memory(user_id, "profile", "preferred_name", name)
        saved.append({"type": "profile", "key": "preferred_name", "value": name})

    # 3. Learning / Explanation Style
    if any(k in text for k in ["i prefer", "explanation style", "explain with", "explain using", "i like"]):
        if any(w in text for w in ["example", "code", "diagram", "analogy", "bullet", "step by step", "visual"]):
            save_user_memory(user_id, "preference", "explanation_style", user_message.strip())
            saved.append({"type": "preference", "key": "explanation_style", "value": user_message.strip()})
    
    if "concise" in text or "short answer" in text or "keep it brief" in text:
        save_user_memory(user_id, "preference", "brevity", "Concise, direct explanations")
        saved.append({"type": "preference", "key": "brevity", "value": "Concise, direct explanations"})
    elif "detailed" in text or "deep dive" in text or "in-depth" in text:
        save_user_memory(user_id, "preference", "brevity", "Detailed, comprehensive explanations")
        saved.append({"type": "preference", "key": "brevity", "value": "Detailed, comprehensive explanations"})

    # 4. Weak topic or struggle
    if any(w in text for w in ["struggle with", "confused about", "hard time understanding", "weak in", "find it difficult to understand"]):
        save_user_memory(user_id, "learning", "weak_topic", user_message.strip())
        saved.append({"type": "learning", "key": "weak_topic", "value": user_message.strip()})

    # 5. Study goal or preparation
    if any(g in text for g in ["preparing for", "study goal", "exam in", "placement", "interview for", "my goal is"]):
        save_user_memory(user_id, "goal", "study_goal", user_message.strip())
        saved.append({"type": "goal", "key": "study_goal", "value": user_message.strip()})

    # 6. Target subject / language
    if "learning " in text or "studying " in text:
        match = re.search(r'(?:learning|studying)\s+([a-zA-Z0-9\+#\s]{2,25})(?:\.|\,|$|\s+and|\s+because)', text)
        if match:
            subject = match.group(1).strip()
            if subject.lower() not in ["more", "this", "that", "it", "everything", "fast", "now", "hard"]:
                save_user_memory(user_id, "subject", "target_subject", subject.capitalize())
                saved.append({"type": "subject", "key": "target_subject", "value": subject.capitalize()})

    # 7. Major / Field of study
    major_match = re.search(r'(?:my major is|majoring in|degree in)\s+([a-zA-Z0-9\s]{3,30})(?:\.|\,|$)', text)
    if major_match:
        major = major_match.group(1).strip().capitalize()
        save_user_memory(user_id, "profile", "academic_major", major)
        saved.append({"type": "profile", "key": "academic_major", "value": major})

    return saved
