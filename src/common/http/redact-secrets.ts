const SECRET_KEYS = new Set([
  'password',
  'token',
  'secret',
  'otp',
  'apiKey',
  'refreshToken',
  'inviteToken',
]);

/** Shallow-redact known secret fields for debug logs. */
export function redactSecrets<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const source = value as Record<string, unknown>;
  const copy: Record<string, unknown> = { ...source };
  for (const key of Object.keys(copy)) {
    if (SECRET_KEYS.has(key)) {
      copy[key] = '[REDACTED]';
    }
  }
  return copy as T;
}
