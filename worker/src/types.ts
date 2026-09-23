export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  GLM_API_KEY?: string;
  DEFAULT_MODEL?: string;
  GEMINI_MODEL?: string;
  NVIDIA_MODEL?: string;
  GLM_MODEL?: string;
  FIREBASE_PROJECT_ID?: string;
  FRONTEND_URL?: string;
}

export interface DecodedUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

export interface UserRecord {
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  study_goals: string | null;
  preferred_learning_style: string | null;
  target_exam: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  model_used: string | null;
  created_at: string;
}

export interface MemoryRecord {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  extracted_from: string | null;
  created_at: string;
  updated_at: string;
}
