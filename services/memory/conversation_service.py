import sqlite3
import uuid
import os
from config import DATABASE_FILE, get_db_connection

def create_conversation(user_id, title="New Study Session"):
    conv_id = uuid.uuid4().hex[:12]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversations (id, user_id, title)
        VALUES (?, ?, ?)
    """, (conv_id, user_id, title))
    conn.commit()
    conn.close()
    return {"id": conv_id, "user_id": user_id, "title": title, "summary": ""}

def get_user_conversations(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, title, summary, created_at, updated_at
        FROM conversations
        WHERE user_id = ?
        ORDER BY updated_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_conversation(user_id, conversation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, title, summary, created_at, updated_at
        FROM conversations
        WHERE id = ? AND user_id = ?
    """, (conversation_id, user_id))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        return None

    cursor.execute("""
        SELECT id, conversation_id, role, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
    """, (conversation_id,))
    msg_rows = cursor.fetchall()
    conn.close()

    result = dict(conv)
    result["messages"] = [dict(row) for row in msg_rows]
    return result

def delete_conversation(user_id, conversation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

def add_message(conversation_id, role, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO messages (conversation_id, role, content)
        VALUES (?, ?, ?)
    """, (conversation_id, role, content))
    cursor.execute("""
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (conversation_id,))
    conn.commit()
    msg_id = cursor.lastrowid
    conn.close()
    return msg_id

def get_recent_messages(conversation_id, limit=10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT role, content
        FROM (
            SELECT id, role, content
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id DESC
            LIMIT ?
        )
        ORDER BY id ASC
    """, (conversation_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_conversation_title(conversation_id, title):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE conversations
        SET title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (title[:60], conversation_id))
    conn.commit()
    conn.close()

def generate_title_from_message(message):
    words = message.strip().split()
    if len(words) <= 5:
        return message.strip().capitalize()
    return " ".join(words[:5]).capitalize() + "..."
