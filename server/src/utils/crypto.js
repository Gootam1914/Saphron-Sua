import crypto from 'node:crypto';
import { env } from '../config/env.js';

// AES-256-GCM field-level encryption for sensitive text stored at rest.
// The key comes from FIELD_ENCRYPTION_KEY (64 hex chars = 32 bytes).
const ALGO = 'aes-256-gcm';

function getKey() {
  const hex = env.fieldEncryptionKey;
  if (!hex || hex.length !== 64) return null; // not configured / invalid
  return Buffer.from(hex, 'hex');
}

export function canEncrypt() {
  return getKey() !== null;
}

export function encrypt(plaintext) {
  const key = getKey();
  if (!key) return { value: plaintext, encrypted: false };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv:tag:ciphertext (all base64)
  const value = [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
  return { value, encrypted: true };
}

export function decrypt(value, encrypted) {
  if (!encrypted) return value;
  const key = getKey();
  if (!key) return '[unable to decrypt: key missing]';
  try {
    const [ivB64, tagB64, dataB64] = String(value).split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return '[unable to decrypt]';
  }
}

export function hashValue(v) {
  return crypto.createHash('sha256').update(String(v)).digest('hex');
}
