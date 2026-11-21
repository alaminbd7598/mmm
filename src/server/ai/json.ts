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

/**
 * Wraps untrusted text (pasted documents, uploaded files, posts) for a prompt: the text sits
 * between `<label>` markers that it cannot close itself, so the model can tell the material to
 * analyse from the instructions around it.
 */
export function asPromptData(label: string, text: string): string {
  const closing = new RegExp(`<\\s*/\\s*${label}\\s*>`, 'gi');
  return `<${label}>\n${text.replace(closing, `<\\/${label}>`)}\n</${label}>`;
}
