export function schemaSyncDecision(
  env: Readonly<Record<string, string | undefined>>
): { sync: true } | { sync: false; message: string };
