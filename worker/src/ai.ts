import { getMessages, getUserMemories, upsertUserMemory } from './db';
import { Env } from './types';

export const STUDY_BUDDY_SYSTEM_PROMPT =
  'You are Study Buddy, an advanced AI study assistant. ' +
  'Your mission is to provide clear, engaging, educational, and accurate answers. ' +
  'Adapt your tone and explanations to the user learning profile. ' +
  'Use examples, simple analogies, and structured markdown formatting where appropriate.';

export async function callGemini(
  apiKey: string,
  model = 'gemini-1.5-flash',
  prompt: string,
  systemInstruction?: string,
  inlineImage?: { mimeType: string; base64: string }
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: any[] = [];
  if (inlineImage) {
    parts.push({
      inline_data: {
        mime_type: inlineImage.mimeType,
        data: inlineImage.base64,
      },
    });
  }
  parts.push({ text: prompt });

  const body: any = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.7,
    },
  };

  if (systemInstruction) {
    body.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response');
  }

  return text;
}

export async function callOpenRouter(
  apiKey: string,
  model = 'nvidia/nemotron-3.5-lightning:free',
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://study-buddy.pages.dev',
      'X-Title': 'Study Buddy',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter returned an empty response');
  }

  return text;
}

export async function generateAI(
  env: Env,
  options: {
    prompt: string;
    systemInstruction?: string;
    model?: string;
    inlineImage?: { mimeType: string; base64: string };
  }
): Promise<{ text: string; modelUsed: string }> {
  const requestedModel = (options.model || env.DEFAULT_MODEL || 'gemini').toLowerCase();
  const geminiKey = env.GEMINI_API_KEY;
  const openRouterKey = env.OPENROUTER_API_KEY || env.NVIDIA_API_KEY || env.GLM_API_KEY;

  const isGemini = requestedModel.includes('gemini');

  // Try primary provider
  if (isGemini) {
    if (geminiKey) {
      try {
        const text = await callGemini(
          geminiKey,
          env.GEMINI_MODEL || 'gemini-1.5-flash',
          options.prompt,
          options.systemInstruction,
          options.inlineImage
        );
        return { text, modelUsed: env.GEMINI_MODEL || 'gemini-1.5-flash' };
      } catch (err) {
        console.warn('[AI] Gemini failed, attempting OpenRouter fallback:', err);
      }
    }
  }

  // OpenRouter or Fallback
  if (openRouterKey && !options.inlineImage) {
    try {
      const openRouterModel = options.model?.includes('/')
        ? options.model
        : env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning:free';
      const text = await callOpenRouter(
        openRouterKey,
        openRouterModel,
        options.prompt,
        options.systemInstruction
      );
      return { text, modelUsed: openRouterModel };
    } catch (err) {
      console.warn('[AI] OpenRouter failed:', err);
    }
  }

  // If Gemini wasn't attempted first and image is not present
  if (!isGemini && geminiKey) {
    try {
      const text = await callGemini(
        geminiKey,
        env.GEMINI_MODEL || 'gemini-1.5-flash',
        options.prompt,
        options.systemInstruction,
        options.inlineImage
      );
      return { text, modelUsed: env.GEMINI_MODEL || 'gemini-1.5-flash' };
    } catch (err) {
      console.error('[AI] Gemini fallback also failed:', err);
    }
  }

  throw new Error('AI generation failed across all available providers. Please check your API keys.');
}

export async function extractAndSaveMemories(
  db: D1Database,
  userId: string,
  userMessage: string
): Promise<void> {
  if (!userId || !userMessage || userMessage.trim().length < 4) return;

  const text = userMessage.toLowerCase().trim();

  // 1. Explicit Remember instruction: "remember that ...", "please remember ..."
  const remMatch = userMessage.match(/(?:please\s+)?(?:remember|keep in mind|note)\s+(?:that\s+)?(.+)/i);
  if (remMatch && remMatch[1].trim().length >= 4) {
    await upsertUserMemory(
      db,
      userId,
      'instruction',
      'user_note',
      remMatch[1].trim(),
      1.0,
      userMessage
    );
  }

  // 2. Preferred Name: "my name is ...", "call me ..."
  const nameMatch = userMessage.match(/(?:my name is|call me)\s+([a-zA-Z]{2,20})/i);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    await upsertUserMemory(
      db,
      userId,
      'profile',
      'preferred_name',
      name.charAt(0).toUpperCase() + name.slice(1),
      1.0,
      userMessage
    );
  }

  // 3. Learning / Explanation Style
  if (['i prefer', 'explanation style', 'explain with', 'explain using', 'i like'].some((k) => text.includes(k))) {
    if (['example', 'code', 'diagram', 'analogy', 'bullet', 'step by step', 'visual'].some((w) => text.includes(w))) {
      await upsertUserMemory(db, userId, 'preference', 'explanation_style', userMessage.trim(), 0.9, userMessage);
    }
  }

  if (text.includes('concise') || text.includes('short answer') || text.includes('keep it brief')) {
    await upsertUserMemory(db, userId, 'preference', 'brevity', 'Concise, direct explanations', 0.9, userMessage);
  } else if (text.includes('detailed') || text.includes('deep dive') || text.includes('in-depth')) {
    await upsertUserMemory(db, userId, 'preference', 'brevity', 'Detailed, comprehensive explanations', 0.9, userMessage);
  }

  // 4. Weak topic
  if (['struggle with', 'confused about', 'hard time understanding', 'weak in'].some((w) => text.includes(w))) {
    await upsertUserMemory(db, userId, 'learning', 'weak_topic', userMessage.trim(), 0.85, userMessage);
  }

  // 5. Study goal
  if (['preparing for', 'study goal', 'exam in', 'placement', 'interview for', 'my goal is'].some((g) => text.includes(g))) {
    await upsertUserMemory(db, userId, 'goal', 'study_goal', userMessage.trim(), 0.9, userMessage);
  }
}

export async function buildAIContext(
  db: D1Database,
  userId: string | null,
  conversationId: string | null,
  currentQuestion: string,
  ragContext?: string | null
): Promise<string> {
  const parts: string[] = [];

  parts.push(`SYSTEM INSTRUCTIONS:\n${STUDY_BUDDY_SYSTEM_PROMPT}`);

  if (userId) {
    const memories = await getUserMemories(db, userId);
    if (memories.length > 0) {
      const profileLines = memories.map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
      parts.push(`USER LEARNING PROFILE & PREFERENCES:\n${profileLines.join('\n')}`);
    }
  }

  if (conversationId) {
    const recentMessages = await getMessages(db, conversationId);
    if (recentMessages.length > 0) {
      const lastMessages = recentMessages.slice(-10);
      const historyLines = lastMessages.map(
        (m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      );
      parts.push(`RECENT CONVERSATION HISTORY:\n${historyLines.join('\n')}`);
    }
  }

  if (ragContext) {
    parts.push(`RELEVANT DOCUMENT CONTEXT (RAG):\n${ragContext}`);
  }

  parts.push(`CURRENT USER QUESTION:\n${currentQuestion}`);

  return parts.join('\n\n----------------------------------------\n\n');
}
