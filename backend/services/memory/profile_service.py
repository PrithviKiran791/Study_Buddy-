import sqlite3
from config import DATABASE_FILE, get_db_connection

def get_user_memories(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, memory_type, memory_key, memory_value, created_at, updated_at
        FROM user_memory
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 20
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_user_memory(user_id, memory_type, memory_key, memory_value):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Check if exact key exists
    cursor.execute("""
        SELECT id FROM user_memory
        WHERE user_id = ? AND memory_type = ? AND memory_key = ?
    """, (user_id, memory_type, memory_key))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE user_memory
            SET memory_value = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (memory_value, existing["id"]))
        conn.commit()
        mem_id = existing["id"]
    else:
        cursor.execute("""
            INSERT INTO user_memory (user_id, memory_type, memory_key, memory_value)
            VALUES (?, ?, ?, ?)
        """, (user_id, memory_type, memory_key, memory_value))
        conn.commit()
        mem_id = cursor.lastrowid

    conn.close()
    return mem_id

def delete_user_memory(user_id, memory_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_memory WHERE id = ? AND user_id = ?", (memory_id, user_id))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

def clear_user_memories(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_memory WHERE user_id = ?", (user_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0
