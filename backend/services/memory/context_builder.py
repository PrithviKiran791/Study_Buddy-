from services.memory.profile_service import get_user_memories
from services.memory.conversation_service import get_recent_messages, get_conversation

def build_ai_context(user_id, conversation_id=None, current_question="", rag_context=None, max_recent=10):
    """
    Build a provider-independent AI prompt context combining:
    1. System Instructions
    2. User Learning Profile
    3. Conversation Summary
    4. Recent Messages
    5. RAG Context
    6. Current Question
    """
    context_parts = []

    # 1. Base System Instructions
    system_instruction = (
        "You are Study Buddy, an advanced AI study assistant. "
        "Your mission is to provide clear, engaging, educational, and accurate answers. "
        "Adapt your tone and explanations to the user's learning profile."
    )
    context_parts.append(f"SYSTEM INSTRUCTIONS:\n{system_instruction}\n")

    # 2. User Learning Profile
    memories = get_user_memories(user_id) if user_id else []
    if memories:
        profile_lines = []
        for mem in memories:
            profile_lines.append(f"- [{mem['memory_type'].upper()}] {mem['memory_key']}: {mem['memory_value']}")
        context_parts.append("USER LEARNING PROFILE & PREFERENCES:\n" + "\n".join(profile_lines) + "\n")

    # 3. Conversation Summary & Recent Messages
    conversation = None
    if user_id and conversation_id:
        conversation = get_conversation(user_id, conversation_id)

    if conversation:
        if conversation.get("summary"):
            context_parts.append(f"PREVIOUS CONVERSATION SUMMARY:\n{conversation['summary']}\n")

        recent_msgs = get_recent_messages(conversation_id, limit=max_recent)
        if recent_msgs:
            formatted_history = []
            for m in recent_msgs:
                role_label = "User" if m["role"] == "user" else "Assistant"
                formatted_history.append(f"{role_label}: {m['content']}")
            context_parts.append("RECENT CONVERSATION HISTORY:\n" + "\n".join(formatted_history) + "\n")

    # 4. RAG Document Context
    if rag_context:
        context_parts.append(f"RELEVANT DOCUMENT CONTEXT (RAG):\n{rag_context}\n")

    # 5. Current User Question
    context_parts.append(f"CURRENT USER QUESTION:\n{current_question}")

    final_prompt = "\n----------------------------------------\n".join(context_parts)
    
    # Also prepare standard chat history format for LLM provider if needed
    history_format = []
    if conversation:
        recent_msgs = get_recent_messages(conversation_id, limit=max_recent)
        for m in recent_msgs:
            role = "user" if m["role"] == "user" else "model"
            history_format.append({"role": role, "parts": [m["content"]]})

    return {
        "full_prompt": final_prompt,
        "history": history_format,
        "memories_count": len(memories),
        "conversation_id": conversation_id,
    }
