import sqlite3
from ai.factory import get_llm_provider
from config import DATABASE_FILE, get_db_connection

SUMMARY_TRIGGER_MESSAGES = 20

def update_summary_in_db(conversation_id, summary_text):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE conversations
        SET summary = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (summary_text, conversation_id))
    conn.commit()
    conn.close()

def maybe_update_conversation_summary(conversation_id):
    """Summarize older messages if total message count exceeds threshold."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?", (conversation_id,))
        count = cursor.fetchone()["cnt"]

        if count < SUMMARY_TRIGGER_MESSAGES:
            conn.close()
            return None

        cursor.execute("""
            SELECT role, content FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            LIMIT ?
        """, (conversation_id, count - 5))
        older_messages = cursor.fetchall()
        conn.close()

        if not older_messages:
            return None

        formatted = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in older_messages])
        prompt = (
            "Summarize the following educational conversation into a concise 2-3 sentence summary. "
            "Highlight main topics discussed and key learning progress:\n\n" + formatted[:4000]
        )

        llm = get_llm_provider()
        summary_text = llm.generate_response(prompt)
        if summary_text:
            update_summary_in_db(conversation_id, summary_text.strip())
            return summary_text
    except Exception as err:
        print(f"[MEMORY SUMMARY] Summary generation note: {err}")
    return None
