import { argon2id, argon2Verify } from 'hash-wasm';
import crypto from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'encoded',
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || !password) return false;
  try {
    return await argon2Verify({ password, hash });
  } catch (err) {
    console.warn('[Password] Argon2 verification fallback:', err);
    return false;
  }
}
