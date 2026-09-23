import { extractText } from 'unpdf';

export interface PDFChunk {
  chunkIndex: number;
  text: string;
}

export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.substring(start, end));
    if (end === clean.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

// In-memory cache for PDF sessions when D1 is not configured or as fast tier
const memorySessionStore = new Map<string, string[]>();

export async function processAndStorePDF(
  db: D1Database | undefined,
  pdfBuffer: ArrayBuffer,
  filename: string
): Promise<{ sessionId: string; totalChunks: number; totalPages: number }> {
  const sessionId = crypto.randomUUID();
  const pdfBytes = new Uint8Array(pdfBuffer);

  const { text, totalPages } = await extractText(pdfBytes);
  const fullText = Array.isArray(text) ? text.join('\n\n') : text || '';

  const chunks = chunkText(fullText);

  // Store in memory cache for immediate querying
  memorySessionStore.set(sessionId, chunks);

  if (db) {
    try {
      await db
        .prepare(`
          INSERT INTO pdf_documents (id, session_id, filename, total_pages)
          VALUES (?, ?, ?, ?)
        `)
        .bind(crypto.randomUUID(), sessionId, filename, totalPages)
        .run();

      const statements = chunks.map((chunk, index) =>
        db
          .prepare(`
            INSERT INTO pdf_chunks (id, session_id, chunk_index, text)
            VALUES (?, ?, ?, ?)
          `)
          .bind(crypto.randomUUID(), sessionId, index, chunk)
      );

      // Batch insert chunks
      for (let i = 0; i < statements.length; i += 25) {
        const batch = statements.slice(i, i + 25);
        await db.batch(batch);
      }
    } catch (err) {
      console.warn('[RAG] D1 write failed, using in-memory store:', err);
    }
  }

  return { sessionId, totalChunks: chunks.length, totalPages: totalPages || 1 };
}

export async function searchPDFChunks(
  db: D1Database | undefined,
  sessionId: string,
  query: string,
  topK = 4
): Promise<string[]> {
  let allChunks: { text: string }[] = [];

  if (db) {
    try {
      const result = await db
        .prepare('SELECT text FROM pdf_chunks WHERE session_id = ?')
        .bind(sessionId)
        .all<{ text: string }>();
      allChunks = result.results || [];
    } catch (err) {
      console.warn('[RAG] D1 query failed, using in-memory store:', err);
    }
  }

  // Fallback to in-memory session store
  if (allChunks.length === 0 && memorySessionStore.has(sessionId)) {
    allChunks = (memorySessionStore.get(sessionId) || []).map((text) => ({ text }));
  }

  if (allChunks.length === 0) return [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryTerms.length === 0) {
    return allChunks.slice(0, topK).map((c) => c.text);
  }

  // Score chunks by query keyword overlap
  const scored = allChunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 1;
      }
    }
    return { text: chunk.text, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((c) => c.text);
}
