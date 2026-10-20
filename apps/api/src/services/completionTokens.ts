import crypto from 'node:crypto';

/** Opaque URL-safe token; only its SHA-256 digest should be persisted. */
export function generateCompletionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashCompletionToken(token: string) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function isWellFormedCompletionToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function completionTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + 72 * 60 * 60 * 1000);
}
