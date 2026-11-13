const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function sanitizeCell(value: string): string {
  const trimmed = value.trimStart();
  if (trimmed.length === 0) return value;
  if (DANGEROUS_PREFIXES.includes(trimmed[0])) {
    return `'${trimmed}`;
  }
  return value;
}

export function sanitizeText(value: unknown): string {
  const text = typeof value === "string" ? value : value == null ? "" : String(value);
  return sanitizeCell(text);
}
