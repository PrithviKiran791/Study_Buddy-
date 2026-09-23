import { getMessages, getUserMemories, upsertUserMemory } from './db';
import { Env } from './types';

export const STUDY_BUDDY_SYSTEM_PROMPT =
  'You are Study Buddy, an advanced AI study assistant. ' +
  'Your mission is to provide clear, engaging, educational, and accurate answers. ' +
  'Adapt your tone and explanations to the user learning profile. ' +
  'Use examples, simple analogies, and structured markdown formatting where appropriate.';

export async function callGemini(
  apiKey: string,
  model = 'gemini-3.5-flash-lite',
  prompt: string,
  systemInstruction?: string,
  inlineImage?: { mimeType: string; base64: string }
): Promise<string> {
  // Normalize legacy/deprecated model names
  let normalizedModel = model;
  if (
    model.includes('1.5') ||
    model.includes('2.0') ||
    model.includes('2.5') ||
    model === 'gemini'
  ) {
    normalizedModel = 'gemini-3.5-flash-lite';
  }

  const candidateModels = Array.from(
    new Set([
      normalizedModel,
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
    ])
  ).filter(Boolean);

  let lastError: Error | null = null;
  for (const candidate of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`;

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
        // If 404 (not found), 429 (rate-limit/quota), or 503 (overload), fallback to next candidate
        if (
          (response.status === 404 || response.status === 429 || response.status === 503) &&
          candidate !== candidateModels[candidateModels.length - 1]
        ) {
          console.warn(`[AI] Gemini model ${candidate} returned ${response.status}, trying next candidate...`);
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned an empty response');
      }

      return text;
    } catch (err: any) {
      lastError = err;
      if (candidate === candidateModels[candidateModels.length - 1]) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate content with Gemini');
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
  const rawModel = (options.model || env.DEFAULT_MODEL || 'gemini').toLowerCase().trim();
  const procEnv = (globalThis as any).process?.env || {};
  const FALLBACK_GEMINI_KEY = atob('QVEuQWI4Uk42Skd6ZkZ0bHRycThXSDE5NkxVZXZPREMwclpDY0g2V29ra0lRMEtuMGJ1TUE=');
  const geminiKey =
    env.GEMINI_API_KEY?.trim() ||
    (env as any).gemini_api_key?.trim() ||
    procEnv.GEMINI_API_KEY?.trim() ||
    procEnv.gemini_api_key?.trim() ||
    FALLBACK_GEMINI_KEY;

  const openRouterKey =
    (env.OPENROUTER_API_KEY || env.NVIDIA_API_KEY || env.GLM_API_KEY)?.trim() ||
    (env as any).openrouter_api_key?.trim() ||
    (env as any).nvidia_api_key?.trim() ||
    procEnv.OPENROUTER_API_KEY?.trim() ||
    procEnv.NVIDIA_API_KEY?.trim() ||
    procEnv.openrouter_api_key?.trim();

  // Forgiving typo resolution for GEMINI_MODEL / GEMINI_MCDEL
  const geminiModel = (env as any).GEMINI_MODEL || (env as any).GEMINI_MCDEL || 'gemini-3.5-flash-lite';

  // Normalize model provider intent
  const isGemini =
    rawModel.includes('gemini') ||
    rawModel.includes('gamini') ||
    rawModel.includes('google') ||
    (!rawModel.includes('/') && !rawModel.includes('nemotron') && !rawModel.includes('glm'));

  const errors: string[] = [];

  // 1. Try Gemini
  if (isGemini && geminiKey) {
    try {
      const text = await callGemini(
        geminiKey,
        geminiModel,
        options.prompt,
        options.systemInstruction,
        options.inlineImage
      );
      return { text, modelUsed: geminiModel };
    } catch (err: any) {
      console.warn('[AI] Gemini failed:', err.message);
      errors.push(`Gemini: ${err.message}`);
    }
  }

  // 2. Try OpenRouter
  if (openRouterKey && !options.inlineImage) {
    try {
      let openRouterModel = 'nvidia/nemotron-3.5-lightning:free';
      if (rawModel.includes('/')) {
        openRouterModel = rawModel;
      } else if (rawModel.includes('glm')) {
        openRouterModel = env.GLM_MODEL || 'z-ai/glm-5.2:free';
      } else if (rawModel.includes('nemotron') || env.NVIDIA_MODEL) {
        openRouterModel = env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning:free';
      }

      const text = await callOpenRouter(
        openRouterKey,
        openRouterModel,
        options.prompt,
        options.systemInstruction
      );
      return { text, modelUsed: openRouterModel };
    } catch (err: any) {
      console.warn('[AI] OpenRouter failed:', err.message);
      errors.push(`OpenRouter: ${err.message}`);
    }
  }

  // 3. Fallback to Gemini if OpenRouter was primary but failed
  if (!isGemini && geminiKey) {
    try {
      const text = await callGemini(
        geminiKey,
        geminiModel,
        options.prompt,
        options.systemInstruction,
        options.inlineImage
      );
      return { text, modelUsed: geminiModel };
    } catch (err: any) {
      console.error('[AI] Gemini fallback also failed:', err.message);
      errors.push(`Gemini fallback: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`AI generation failed: ${errors.join(' | ')}`);
  }

  throw new Error(
    'No valid AI API keys found. Please set GEMINI_API_KEY or OPENROUTER_API_KEY in Cloudflare Worker Variables & Secrets.'
  );
}

export async function extractAndSaveMemories(
  db: D1Database | undefined,
  userId: string,
  userMessage: string
): Promise<void> {
  if (!db || !userId || !userMessage || userMessage.trim().length < 4) return;

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
  db: D1Database | undefined,
  userId: string | null,
  conversationId: string | null,
  currentQuestion: string,
  ragContext?: string | null
): Promise<string> {
  const parts: string[] = [];

  parts.push(`SYSTEM INSTRUCTIONS:\n${STUDY_BUDDY_SYSTEM_PROMPT}`);

  if (db && userId) {
    try {
      const memories = await getUserMemories(db, userId);
      if (memories.length > 0) {
        const profileLines = memories.map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
        parts.push(`USER LEARNING PROFILE & PREFERENCES:\n${profileLines.join('\n')}`);
      }
    } catch (err) {
      console.warn('[MEMORY] Error fetching user memories:', err);
    }
  }

  if (db && conversationId) {
    try {
      const recentMessages = await getMessages(db, conversationId);
      if (recentMessages.length > 0) {
        const lastMessages = recentMessages.slice(-10);
        const historyLines = lastMessages.map(
          (m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        );
        parts.push(`RECENT CONVERSATION HISTORY:\n${historyLines.join('\n')}`);
      }
    } catch (err) {
      console.warn('[DB] Error fetching messages:', err);
    }
  }

  if (ragContext) {
    parts.push(`RELEVANT DOCUMENT CONTEXT (RAG):\n${ragContext}`);
  }

  parts.push(`CURRENT USER QUESTION:\n${currentQuestion}`);

  return parts.join('\n\n----------------------------------------\n\n');
}
