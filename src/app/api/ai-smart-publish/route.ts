import { classifyContentDeterministically } from '@/src/utils/admissionToken2027Logic';
import { getStore, storageMode } from '@/src/server/db/store';
import { requireStaffPermission } from '@/src/server/auth/session';
import { HttpError, assertSameOrigin, handleError, json, rateLimit, readJson } from '@/src/server/http';
import { getGenAI, getGeminiModel } from '@/src/server/ai/gemini';
import { parseModelJson } from '@/src/server/ai/json';
import {
  SMART_PUBLISH_RESPONSE_SCHEMA,
  SMART_PUBLISH_SYSTEM_INSTRUCTION,
  buildSmartPublishPrompt,
  mergeSmartPublishSuggestion,
  smartPublishRequestSchema,
} from '@/src/server/ai/smart-publish';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;
const GEMINI_TIMEOUT_MS = 45_000;

/** AI Publisher: route a post/document to a site section (Gemini, else deterministic rules). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireStaffPermission('ai-publisher', 'view');
    if (!rateLimit(`ai-smart-publish:${session.userId}`, 60, 10 * 60 * 1000)) {
      throw new HttpError(429, 'Too many requests. Please try again shortly.', 'RATE_LIMITED');
    }
    const parsed = smartPublishRequestSchema.safeParse(await readJson(req, MAX_BODY_BYTES));
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message || 'Text or source URL is required', 'BAD_REQUEST');
    }
    const input = parsed.data;

    const { state } = await (await getStore()).getSnapshot();
    const huffazCount = Array.isArray(state.hifzTreeConfig?.graduates) ? state.hifzTreeConfig.graduates.length : 30;
    const fallback = classifyContentDeterministically(input.rawText, input.sourceUrl, huffazCount);

    // Demo servers use public sample sign-ins, so they never spend the Gemini key on staff tools.
    const ai = storageMode() === 'demo' ? null : getGenAI();
    if (!ai) return json({ ok: true, mode: 'deterministic', suggestion: fallback });

    try {
      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: buildSmartPublishPrompt(input),
        config: {
          systemInstruction: SMART_PUBLISH_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: SMART_PUBLISH_RESPONSE_SCHEMA,
          abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      });
      const modelOutput = parseModelJson(response.text);
      if (!modelOutput) return json({ ok: true, mode: 'deterministic', suggestion: fallback });
      const suggestion = mergeSmartPublishSuggestion(fallback, modelOutput, {
        sourceUrl: input.sourceUrl,
        nextHafizSerial: Math.max(31, huffazCount + 1),
        year: String(new Date().getFullYear()),
      });
      return json({ ok: true, mode: 'gemini', suggestion });
    } catch (err) {
      console.warn('[api/ai-smart-publish] Gemini request failed:', err instanceof Error ? err.name : 'unknown');
      return json({ ok: true, mode: 'deterministic', suggestion: fallback });
    }
  } catch (err) {
    return handleError(err);
  }
}
