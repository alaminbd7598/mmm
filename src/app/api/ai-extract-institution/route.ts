import { requireStaffPermission } from '@/src/server/auth/session';
import { HttpError, assertSameOrigin, handleError, json, rateLimit, readJson } from '@/src/server/http';
import { getGenAI, getGeminiModel } from '@/src/server/ai/gemini';
import { parseModelJson } from '@/src/server/ai/json';
import { EXTRACT_RESPONSE_SCHEMA, buildExtractionParts, extractRequestSchema } from '@/src/server/ai/institution-extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_BODY_BYTES = 20 * 1024 * 1024;
const GEMINI_TIMEOUT_MS = 110_000;

/** Backup & AI tab: extract institution details from pasted text / PDF / text files. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireStaffPermission('backup-ai', 'edit');
    if (!rateLimit(`ai-extract:${session.userId}`, 20, 10 * 60 * 1000)) {
      throw new HttpError(429, 'Too many requests. Please try again shortly.', 'RATE_LIMITED');
    }
    const parsed = extractRequestSchema.safeParse(await readJson(req, MAX_BODY_BYTES));
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid document payload', 'BAD_REQUEST');
    }

    const ai = getGenAI();
    if (!ai) return json({ aiExtracted: null, fallbackReason: 'NO_API_KEY' });

    const parts = buildExtractionParts(parsed.data);
    if (parts.length === 0) throw new HttpError(400, 'No document content provided', 'BAD_REQUEST');

    try {
      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: { role: 'user', parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: EXTRACT_RESPONSE_SCHEMA,
          abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      });
      const extracted = parseModelJson(response.text);
      if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
        return json({ aiExtracted: null, fallbackReason: 'AI_BAD_RESPONSE' });
      }
      return json({ aiExtracted: extracted });
    } catch (err) {
      console.warn('[api/ai-extract-institution] Gemini request failed:', err instanceof Error ? err.name : 'unknown');
      return json({ aiExtracted: null, fallbackReason: 'AI_ERROR' });
    }
  } catch (err) {
    return handleError(err);
  }
}
