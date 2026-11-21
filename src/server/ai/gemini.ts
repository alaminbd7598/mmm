import 'server-only';
import { GoogleGenAI } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

type GlobalWithGenAI = typeof globalThis & { __mmmGenAI?: { apiKey: string; client: GoogleGenAI } };

/**
 * Shared Gemini client, or null when GEMINI_API_KEY is not configured (callers then use their
 * deterministic fallbacks so the UI keeps working without a key).
 */
export function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  const g = globalThis as GlobalWithGenAI;
  if (g.__mmmGenAI?.apiKey !== apiKey) {
    g.__mmmGenAI = { apiKey, client: new GoogleGenAI({ apiKey }) };
  }
  return g.__mmmGenAI.client;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}
