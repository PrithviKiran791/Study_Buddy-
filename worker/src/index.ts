import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, optionalAuthMiddleware, verifyFirebaseToken } from './auth';
import {
  buildAIContext,
  extractAndSaveMemories,
  generateAI,
  STUDY_BUDDY_SYSTEM_PROMPT,
} from './ai';
import {
  addMessage,
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  getMessages,
  getUser,
  getUserMemories,
  initDb,
  updateUserProfile,
  upsertUser,
} from './db';
import { processAndStorePDF, searchPDFChunks } from './rag';
import { DecodedUser, Env } from './types';

const app = new Hono<{ Bindings: Env; Variables: { user?: DecodedUser } }>();

// Enable CORS for external callers (if frontend is hosted separately or on localhost)
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// Auto-initialize D1 DB schema if needed
let dbInitialized = false;
app.use('/api/*', async (c, next) => {
  if (!dbInitialized && c.env.DB) {
    try {
      await initDb(c.env.DB);
      dbInitialized = true;
    } catch (err) {
      console.warn('[DB] Schema init warning:', err);
    }
  }
  await next();
});

// ==========================================
// 1. Health & Discovery Endpoints
// ==========================================

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '2.0.0',
    platform: 'cloudflare-worker',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/models', (c) => {
  return c.json({
    default: c.env.DEFAULT_MODEL || 'gemini',
    available: [
      {
        id: 'gemini',
        name: 'Google Gemini 1.5 Flash',
        provider: 'Google',
        speed: 'Ultra Fast',
        free: true,
      },
      {
        id: 'nvidia',
        name: 'NVIDIA Nemotron 3.5 Lightning',
        provider: 'OpenRouter',
        speed: 'Fast',
        free: true,
      },
      {
        id: 'glm',
        name: 'GLM 5.2 Free',
        provider: 'OpenRouter',
        speed: 'Standard',
        free: true,
      },
    ],
  });
});

// ==========================================
// 2. Core AI Endpoints
// ==========================================

// Chat endpoint with persistent memory integration
app.post('/api/chat', optionalAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const message = body.message || body.prompt;

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Message is required' }, 400);
    }

    const conversationId = body.conversation_id || null;
    const model = body.model;

    // Build context with user memories & history
    const contextPrompt = await buildAIContext(
      c.env.DB,
      user?.uid || null,
      conversationId,
      message
    );

    const { text, modelUsed } = await generateAI(c.env, {
      prompt: contextPrompt,
      systemInstruction: STUDY_BUDDY_SYSTEM_PROMPT,
      model,
    });

    // Background memory extraction
    if (user?.uid && c.env.DB) {
      const db = c.env.DB;
      c.executionCtx.waitUntil(
        extractAndSaveMemories(db, user.uid, message).catch((err) =>
          console.warn('[MEMORY] Extraction error:', err)
        )
      );
    }

    // Save message to conversation if conversation_id provided
    if (conversationId && user?.uid && c.env.DB) {
      const db = c.env.DB;
      c.executionCtx.waitUntil(
        (async () => {
          try {
            await addMessage(db, conversationId, 'user', message, modelUsed);
            await addMessage(db, conversationId, 'assistant', text, modelUsed);
          } catch (err) {
            console.warn('[DB] Failed to record chat messages:', err);
          }
        })()
      );
    }

    return c.json({
      reply: text,
      response: text,
      conversation_id: conversationId,
      model_used: modelUsed,
    });
  } catch (err: any) {
    console.error('[API /api/chat] Error:', err);
    return c.json({ error: err.message || 'Failed to process chat message' }, 500);
  }
});

// Helper to extract text from URL
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 StudyBuddyBot/2.0' } });
    if (!res.ok) return `Error fetching URL (status ${res.status})`;
    const html = await res.text();
    // Simple HTML text extractor
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (err: any) {
    return `Error fetching URL: ${err.message}`;
  }
}

// 1. Text & URL Summarizer (handles both /api/summarize and /api/generate-summary)
const handleSummarize = async (c: any) => {
  try {
    const body = await c.req.json();
    let text = (body.text || body.content || '').trim();
    const url = (body.url || '').trim();

    if (url) {
      const extracted = await extractTextFromUrl(url);
      if (extracted.startsWith('Error')) {
        return c.json({ error: extracted }, 400);
      }
      text = extracted;
    }

    if (!text) {
      return c.json({ error: 'Please provide text or a valid URL' }, 400);
    }

    const prompt =
      `Summarize the following content in clear, engaging, educational sentences. ` +
      `Use clean bullet points for key takeaways if helpful, and keep it digestible for quick revision:\n\n${text.slice(0, 10000)}`;

    const { text: summary, modelUsed } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    const preview = text.slice(0, 500) + (text.length > 500 ? '...' : '');
    return c.json({
      summary,
      input_preview: preview,
      model_used: modelUsed,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to summarize' }, 500);
  }
};
app.post('/api/summarize', handleSummarize);
app.post('/api/generate-summary', handleSummarize);

// 2. Research Assistant (/api/research)
app.post('/api/research', async (c) => {
  try {
    const body = await c.req.json();
    const topic = (body.topic || '').trim();
    if (!topic) {
      return c.json({ error: 'Please enter a topic' }, 400);
    }

    const prompt =
      `Conduct an in-depth academic research overview on the topic: "${topic}".\n\n` +
      `Structure your response with clear Markdown formatting:\n` +
      `# Executive Summary\n` +
      `## Foundational Concepts & Key Definitions\n` +
      `## Detailed Technical/Academic Analysis\n` +
      `## Real-World Applications & Case Studies\n` +
      `## Key Takeaways & Study Recommendations\n\n` +
      `Be comprehensive, authoritative, clear, and educational.`;

    const { text: content } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    return c.json({ topic, content });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate research' }, 500);
  }
});

// 3. Flashcard Generator (handles both /api/flashcards and /api/generate-flashcards)
const handleFlashcards = async (c: any) => {
  try {
    const body = await c.req.json();
    const topic = (body.topic || '').trim();
    const count = parseInt(body.count || '5', 10);

    if (!topic) {
      return c.json({ error: 'Topic is required' }, 400);
    }

    const prompt =
      `Generate exactly ${count} educational flashcards for: ${topic}.\n\n` +
      `Return ONLY a valid, parseable JSON array of objects, where each object has 'question' and 'answer' keys. ` +
      `Do NOT wrap the response in markdown code blocks (like \`\`\`json), and do NOT add any conversational prefix or suffix.\n\n` +
      `Format Example:\n` +
      `[{"question": "What is photosynthesis?", "answer": "The process by which plants use sunlight to synthesize nutrients."}]`;

    const { text: result } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    let cards: any[] = [];
    try {
      const cleanJson = result.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      cards = JSON.parse(cleanJson);
      if (!Array.isArray(cards)) cards = [];
    } catch {
      cards = [
        { question: `Key concept of ${topic}`, answer: result.slice(0, 200) },
      ];
    }

    return c.json({
      topic,
      cards,
      flashcards: cards,
      count: cards.length,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate flashcards' }, 500);
  }
};
app.post('/api/flashcards', handleFlashcards);
app.post('/api/generate-flashcards', handleFlashcards);

// 4. Study Planner (handles both /api/study-plan and /api/generate-study-plan)
const handleStudyPlan = async (c: any) => {
  try {
    const body = await c.req.json();
    const syllabus = body.syllabus;
    const topics = body.topics || '';
    const startDate = body.start_date || 'Today';
    const deadline = body.deadline || '1 month from now';

    if (!syllabus) {
      return c.json({ error: 'Syllabus is required' }, 400);
    }

    const topicsStr = topics ? ` (Focus topics: ${topics})` : '';
    const prompt =
      `Create a detailed, highly structured daily or weekly study plan based on the following syllabus details:\n` +
      `Syllabus/Goals: ${syllabus}${topicsStr}\n` +
      `Timeline: From ${startDate} to ${deadline}.\n\n` +
      `Format the plan beautifully in Markdown with clear daily or weekly objectives, milestones, ` +
      `rest days, and advice on how to study these subjects. Ensure it fits exactly within the dates provided.`;

    const { text: plan } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    return c.json({ study_plan: plan, plan });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate study plan' }, 500);
  }
};
app.post('/api/study-plan', handleStudyPlan);
app.post('/api/generate-study-plan', handleStudyPlan);

// 5. Quiz & Question Generator (handles both /api/generate-questions and /api/generate-quiz)
const handleQuestions = async (c: any) => {
  try {
    const body = await c.req.json();
    const paragraph = body.paragraph || body.text;

    if (!paragraph) {
      return c.json({ error: 'Paragraph or text is required' }, 400);
    }

    const prompt =
      `Generate exactly 5 high-quality, relevant educational questions based strictly on the following text.\n` +
      `Return them as a clean plain text list with exactly one question per line without any numbers, letters, or bullet points.\n\n` +
      `Text:\n${paragraph}`;

    const { text: result } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    const questions = result
      .split('\n')
      .map((q) => q.replace(/^[\d\.\-\*\)\s]+/, '').trim())
      .filter((q) => q.length > 5);

    return c.json({ questions, input_paragraph: paragraph });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate questions' }, 500);
  }
};
app.post('/api/generate-questions', handleQuestions);
app.post('/api/generate-quiz', handleQuestions);

// 6. Notes Generator (/api/generate-notes)
app.post('/api/generate-notes', async (c) => {
  try {
    const body = await c.req.json();
    const topic = (body.topic || '').trim();
    const material = (body.material || '').trim();

    if (!topic) {
      return c.json({ error: 'Please enter a topic' }, 400);
    }

    let prompt = `Create comprehensive, beautifully structured study notes about ${topic}.`;
    if (material) {
      prompt += ` Use the following source material:\n${material}`;
    }
    prompt += '\nFormat the output in clean, readable markdown with bullet points, sub-headings, and definitions of key terms.';

    const { text: notes } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    return c.json({ topic, notes });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate notes' }, 500);
  }
});

// 7. Web Search QA (/api/web-search)
app.post('/api/web-search', async (c) => {
  try {
    const body = await c.req.json();
    const question = (body.question || '').trim();
    if (!question) {
      return c.json({ error: 'Please enter a question' }, 400);
    }

    const prompt = `Search and answer: ${question}. Provide a detailed, educational response with practical examples.`;
    const { text: answer } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    return c.json({ question, answer });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to perform search' }, 500);
  }
});

// ==========================================
// 3. Document RAG Endpoints (PDF Upload & Chat)
// ==========================================

app.post('/api/upload-pdf', async (c) => {
  try {
    const formData = await c.req.formData();
    // Accept either pdf_file, file, or pdf field names
    const file = (formData.get('pdf_file') || formData.get('file') || formData.get('pdf')) as File | null;

    if (!file) {
      return c.json({ error: 'No PDF file provided' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const { sessionId, totalChunks, totalPages } = await processAndStorePDF(
      c.env.DB,
      arrayBuffer,
      file.name
    );

    return c.json({
      session_id: sessionId,
      message: 'PDF processed successfully',
      preview: `Processed ${file.name} (${totalPages} page${totalPages === 1 ? '' : 's'})`,
      total_chunks: totalChunks,
      total_pages: totalPages,
    });
  } catch (err: any) {
    console.error('[API /api/upload-pdf] Error:', err);
    return c.json({ error: err.message || 'Failed to process PDF' }, 500);
  }
});

// PDF Chat endpoint (handles both /api/pdf-chat and /api/chat-pdf)
const handlePdfChat = async (c: any) => {
  try {
    const body = await c.req.json();
    const sessionId = body.session_id;
    const question = body.question || body.message;

    if (!sessionId || !question) {
      return c.json({ error: 'session_id and question are required' }, 400);
    }

    const contextChunks = await searchPDFChunks(c.env.DB, sessionId, question);
    const context = contextChunks.join('\n\n---\n\n');

    const prompt =
      `You are an AI assistant helping a student understand a document.\n` +
      `Use the following context extracted from the document to answer the student's question in detail and educationally.\n\n` +
      `Context:\n${context || 'No specific document context found.'}\n\n` +
      `Question: ${question}\n\nAnswer:`;

    const { text: reply, modelUsed } = await generateAI(c.env, {
      prompt,
      model: body.model,
    });

    return c.json({
      reply,
      response: reply,
      answer: reply,
      context_used: contextChunks.length > 0,
      model_used: modelUsed,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to query PDF' }, 500);
  }
};
app.post('/api/pdf-chat', handlePdfChat);
app.post('/api/chat-pdf', handlePdfChat);

// Visual QA endpoint (Gemini Multimodal)
app.post('/api/visual-qa', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File | null;
    const prompt = (formData.get('prompt') as string) || 'Explain this image in an educational context.';

    if (!file) {
      return c.json({ error: 'Image file is required' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    const { text } = await generateAI(c.env, {
      prompt,
      model: 'gemini',
      inlineImage: {
        mimeType: file.type || 'image/jpeg',
        base64,
      },
    });

    return c.json({ answer: text, reply: text });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to analyze image' }, 500);
  }
});

// ==========================================
// 4. User Memory & Profile Endpoints
// ==========================================

app.get('/api/user/memory', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ memories: [] });
  }
  const user = c.get('user')!;
  const memories = await getUserMemories(c.env.DB, user.uid);
  return c.json({
    memories: memories.map((m) => ({
      category: m.category,
      key: m.key,
      value: m.value,
      confidence: m.confidence,
      updated_at: m.updated_at,
    })),
  });
});

app.post('/api/auth/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = body.token || c.req.header('Authorization')?.replace(/^Bearer\s+/, '');

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  const projectId = c.env.FIREBASE_PROJECT_ID || 'studyassistant-26fb6';
  const decoded = await verifyFirebaseToken(token, projectId);

  if (!decoded) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  let user: any = {
    firebase_uid: decoded.uid,
    email: decoded.email,
    display_name: decoded.name,
    photo_url: decoded.picture,
  };

  if (c.env.DB) {
    try {
      user = await upsertUser(c.env.DB, user);
    } catch (err) {
      console.warn('[DB] User upsert warning:', err);
    }
  }

  return c.json({ user });
});

app.get('/api/auth/profile', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ user: null });
  }
  const user = c.get('user')!;
  const profile = await getUser(c.env.DB, user.uid);
  return c.json({ user: profile });
});

app.put('/api/auth/profile', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ user: null });
  }
  const user = c.get('user')!;
  const body = await c.req.json();
  const updated = await updateUserProfile(c.env.DB, user.uid, body);
  return c.json({ user: updated });
});

// ==========================================
// 5. Conversations & Messages Endpoints
// ==========================================

app.get('/api/conversations', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ conversations: [] });
  }
  const user = c.get('user')!;
  const conversations = await getConversations(c.env.DB, user.uid);
  return c.json({ conversations });
});

app.post('/api/conversations', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const title = body.title || 'New Conversation';
  const subject = body.subject || 'General';

  const conversation = await createConversation(c.env.DB, user.uid, title, subject);
  return c.json({ conversation }, 201);
});

app.get('/api/conversations/:id', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  const user = c.get('user')!;
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 400);
  const conversation = await getConversation(c.env.DB, id, user.uid);

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const messages = await getMessages(c.env.DB, id);
  return c.json({ conversation, messages });
});

app.delete('/api/conversations/:id', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  const user = c.get('user')!;
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 400);
  const deleted = await deleteConversation(c.env.DB, id, user.uid);

  if (!deleted) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  return c.json({ message: 'Conversation deleted successfully' });
});

app.get('/api/conversations/:id/messages', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ messages: [] });
  }
  const user = c.get('user')!;
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 400);
  const conversation = await getConversation(c.env.DB, id, user.uid);

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const messages = await getMessages(c.env.DB, id);
  return c.json({ messages });
});

app.post('/api/conversations/:id/messages', authMiddleware, async (c) => {
  if (!c.env.DB) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  const user = c.get('user')!;
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 400);
  const conversation = await getConversation(c.env.DB, id, user.uid);

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const body = await c.req.json();
  const sender = body.sender || 'user';
  const content = body.content;
  const modelUsed = body.model_used || null;

  if (!content) {
    return c.json({ error: 'Content is required' }, 400);
  }

  const message = await addMessage(c.env.DB, id, sender, content, modelUsed);
  return c.json({ message }, 201);
});

// ==========================================
// 6. Static Assets (React Vite SPA Fallback)
// ==========================================

app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return await c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
