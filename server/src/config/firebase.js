import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let initialized = false;

/**
 * Initialize the Firebase Admin SDK from either:
 *   1) server/serviceAccountKey.json, or
 *   2) the FIREBASE_* env vars.
 * In demo mode this is optional and silently skipped.
 */
export function initFirebase() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const keyFile = path.join(__dirname, '..', '..', 'serviceAccountKey.json');
  try {
    if (fs.existsSync(keyFile)) {
      const sa = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      initialized = true;
      console.log('[firebase] initialized from serviceAccountKey.json');
      return admin;
    }
    if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
      initialized = true;
      console.log('[firebase] initialized from environment variables');
      return admin;
    }
  } catch (err) {
    console.warn('[firebase] initialization failed:', err.message);
  }

  if (!env.demoMode) {
    console.warn('[firebase] not configured and DEMO_MODE is false - token verification will fail.');
  } else {
    console.log('[firebase] not configured; running in DEMO_MODE (demo tokens accepted).');
  }
  return null;
}

export function isFirebaseReady() {
  return admin.apps.length > 0;
}

export { admin };
