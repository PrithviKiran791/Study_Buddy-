import { ConversationRecord, MemoryRecord, MessageRecord, UserRecord } from './types';

export async function initDb(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        firebase_uid TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        photo_url TEXT,
        study_goals TEXT,
        preferred_learning_style TEXT,
        target_exam TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        subject TEXT DEFAULT 'General',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (firebase_uid) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender TEXT NOT NULL CHECK(sender IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        model_used TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_memory (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        extracted_from TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category, key),
        FOREIGN KEY (user_id) REFERENCES users (firebase_uid) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pdf_documents (
        id TEXT PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        total_pages INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pdf_chunks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES pdf_documents (session_id) ON DELETE CASCADE
      )
    `),
  ]);
}

export async function upsertUser(
  db: D1Database,
  userData: {
    firebase_uid: string;
    email?: string | null;
    display_name?: string | null;
    photo_url?: string | null;
  }
): Promise<UserRecord> {
  const existing = await db
    .prepare('SELECT * FROM users WHERE firebase_uid = ?')
    .bind(userData.firebase_uid)
    .first<UserRecord>();

  if (existing) {
    await db
      .prepare(`
        UPDATE users
        SET email = COALESCE(?, email),
            display_name = COALESCE(?, display_name),
            photo_url = COALESCE(?, photo_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE firebase_uid = ?
      `)
      .bind(
        userData.email || null,
        userData.display_name || null,
        userData.photo_url || null,
        userData.firebase_uid
      )
      .run();
    return (await db
      .prepare('SELECT * FROM users WHERE firebase_uid = ?')
      .bind(userData.firebase_uid)
      .first<UserRecord>())!;
  }

  await db
    .prepare(`
      INSERT INTO users (firebase_uid, email, display_name, photo_url)
      VALUES (?, ?, ?, ?)
    `)
    .bind(
      userData.firebase_uid,
      userData.email || null,
      userData.display_name || null,
      userData.photo_url || null
    )
    .run();

  return (await db
    .prepare('SELECT * FROM users WHERE firebase_uid = ?')
    .bind(userData.firebase_uid)
    .first<UserRecord>())!;
}

export async function getUser(db: D1Database, firebase_uid: string): Promise<UserRecord | null> {
  return await db
    .prepare('SELECT * FROM users WHERE firebase_uid = ?')
    .bind(firebase_uid)
    .first<UserRecord>();
}

export async function updateUserProfile(
  db: D1Database,
  firebase_uid: string,
  profile: {
    display_name?: string;
    study_goals?: string;
    preferred_learning_style?: string;
    target_exam?: string;
  }
): Promise<UserRecord | null> {
  await db
    .prepare(`
      UPDATE users
      SET display_name = COALESCE(?, display_name),
          study_goals = COALESCE(?, study_goals),
          preferred_learning_style = COALESCE(?, preferred_learning_style),
          target_exam = COALESCE(?, target_exam),
          updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = ?
    `)
    .bind(
      profile.display_name !== undefined ? profile.display_name : null,
      profile.study_goals !== undefined ? profile.study_goals : null,
      profile.preferred_learning_style !== undefined ? profile.preferred_learning_style : null,
      profile.target_exam !== undefined ? profile.target_exam : null,
      firebase_uid
    )
    .run();

  return getUser(db, firebase_uid);
}

export async function getConversations(
  db: D1Database,
  userId: string
): Promise<ConversationRecord[]> {
  const result = await db
    .prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId)
    .all<ConversationRecord>();
  return result.results || [];
}

export async function getConversation(
  db: D1Database,
  id: string,
  userId: string
): Promise<ConversationRecord | null> {
  return await db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<ConversationRecord>();
}

export async function createConversation(
  db: D1Database,
  userId: string,
  title = 'New Conversation',
  subject = 'General'
): Promise<ConversationRecord> {
  const id = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO conversations (id, user_id, title, subject)
      VALUES (?, ?, ?, ?)
    `)
    .bind(id, userId, title, subject)
    .run();

  return (await db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .bind(id)
    .first<ConversationRecord>())!;
}

export async function deleteConversation(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const res = await db
    .prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();
  return (res.meta.changes || 0) > 0;
}

export async function getMessages(
  db: D1Database,
  conversationId: string
): Promise<MessageRecord[]> {
  const result = await db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .bind(conversationId)
    .all<MessageRecord>();
  return result.results || [];
}

export async function addMessage(
  db: D1Database,
  conversationId: string,
  sender: 'user' | 'assistant' | 'system',
  content: string,
  modelUsed: string | null = null
): Promise<MessageRecord> {
  const id = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO messages (id, conversation_id, sender, content, model_used)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(id, conversationId, sender, content, modelUsed)
    .run();

  await db
    .prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(conversationId)
    .run();

  return (await db
    .prepare('SELECT * FROM messages WHERE id = ?')
    .bind(id)
    .first<MessageRecord>())!;
}

export async function getUserMemories(
  db: D1Database,
  userId: string
): Promise<MemoryRecord[]> {
  const result = await db
    .prepare('SELECT * FROM user_memory WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId)
    .all<MemoryRecord>();
  return result.results || [];
}

export async function upsertUserMemory(
  db: D1Database,
  userId: string,
  category: string,
  key: string,
  value: string,
  confidence = 1.0,
  extractedFrom: string | null = null
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO user_memory (id, user_id, category, key, value, confidence, extracted_from)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, category, key) DO UPDATE SET
        value = excluded.value,
        confidence = excluded.confidence,
        extracted_from = excluded.extracted_from,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(id, userId, category, key, value, confidence, extractedFrom)
    .run();
}
