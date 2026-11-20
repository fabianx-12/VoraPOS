import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Generates a cryptographically secure hash for PINs and passwords.
 * Format: "salt:hash" (hex encoded)
 */
export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(secret, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Validates a plaintext secret against a stored "salt:hash".
 * Uses timing-safe byte equality to prevent timing attacks.
 */
export async function verifySecret(secret: string, combinedHash: string): Promise<boolean> {
  const parts = combinedHash.split(':');
  if (parts.length !== 2) return false;

  const [salt, key] = parts;
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(secret, salt, 64)) as Buffer;

  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(keyBuffer, derivedKey);
}
