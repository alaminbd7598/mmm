/** Parse a model's JSON text response; null when absent or malformed. */
export function parseModelJson(text: string | undefined | null): unknown {
  if (!text) return null;
  // Some models wrap JSON in a Markdown code fence even when a JSON MIME type was requested.
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}
