import { getStore } from '@/src/server/db/store';
import { HttpError, assertRateLimit, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { GLOBAL_PREFIX, consume } from '@/src/server/rate-limit';
import { getGenAI, getGeminiModel } from '@/src/server/ai/gemini';
import { buildChatSystemPrompt, chatRequestSchema } from '@/src/server/ai/chat-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8 * 1024;
const GEMINI_TIMEOUT_MS = 25_000;

/** CHAT_DAILY_LIMIT (default 3000): Gemini-backed chat replies per day across all visitors. */
function chatDailyLimit(): number {
  const raw = Number.parseInt(process.env.CHAT_DAILY_LIMIT ?? '', 10);
  return Number.isInteger(raw) && raw >= 0 ? raw : 3000;
}

/** Noor AI. `{reply: null}` tells the widget to keep its local knowledge-base answer. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'chat', 20, 5 * 60 * 1000);
    const parsed = chatRequestSchema.safeParse(await readJson(req, MAX_BODY_BYTES));
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message || 'Message is required', 'BAD_REQUEST');
    }
    const { message, language } = parsed.data;

    const ai = getGenAI();
    if (!ai) return json({ reply: null });

    const { state } = await (await getStore()).getSnapshot();
    if (state.aiBotConfig?.enabled === false) return json({ reply: null });
    // Site-wide daily cap on paid Gemini calls, whatever addresses the requests come from.
    // Beyond it the widget keeps answering from its local knowledge base.
    if (!consume(`${GLOBAL_PREFIX}chat-gemini`, chatDailyLimit(), 24 * 60 * 60 * 1000)) return json({ reply: null });

    try {
      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: message,
        config: {
          systemInstruction: buildChatSystemPrompt({ aiBotConfig: state.aiBotConfig, settings: state.settings, language }),
          temperature: 0.3,
          abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      });
      return json({ reply: response.text?.trim() || null });
    } catch (err) {
      console.warn('[api/chat] Gemini request failed:', err instanceof Error ? err.name : 'unknown');
      return json({ reply: null });
    }
  } catch (err) {
    return handleError(err);
  }
}
