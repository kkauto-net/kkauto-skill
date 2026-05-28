const SECRET_PATTERNS = [
  /(["']?KK_API_TOKEN["']?\s*[:=]\s*["']?)([^\s,"'}]+)/gi,
  /(["']?Authorization["']?\s*[:=]\s*["']?Bearer\s+)([^\s,"'}]+)/gi,
  /(["']?bearer[_-]?token["']?\s*[:=]\s*["']?)([^\s,"'}]+)/gi,
  /(["']?api[_-]?key["']?\s*[:=]\s*["']?)([^\s,"'}]+)/gi
];

export function redact(input: string): string {
  return SECRET_PATTERNS.reduce(
    (value, pattern) => value.replace(pattern, '$1[REDACTED]'),
    input
  );
}

export function redactObject<T>(value: T): T {
  return JSON.parse(redact(JSON.stringify(value))) as T;
}
