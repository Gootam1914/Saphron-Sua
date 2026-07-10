import { admin, isFirebaseReady } from '../config/firebase.js';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { asyncHandler, httpError } from '../utils/asyncHandler.js';

/**
 * Verify the caller's identity from the Authorization: Bearer <token> header.
 *
 * Two token forms are supported:
 *  - A real Firebase ID token (verified via the Admin SDK). Used in production
 *    and whenever Firebase is configured.
 *  - A demo token of the form "demo:<email>" - ONLY accepted when DEMO_MODE=true.
 *    This lets the app be run and demoed locally without any cloud accounts.
 *
 * On success, attaches req.authIdentity = { uid, email, name, picture }.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw httpError(401, 'Missing Authorization bearer token.');

  // Demo token path
  if (token.startsWith('demo:')) {
    if (!env.demoMode) throw httpError(401, 'Demo tokens are disabled.');
    const email = token.slice(5).toLowerCase().trim();
    if (!email) throw httpError(401, 'Malformed demo token.');
    req.authIdentity = { uid: `demo_${email}`, email, name: '', picture: '', demo: true };
    return next();
  }

  // Real Firebase token path
  if (!isFirebaseReady()) {
    throw httpError(
      401,
      'Firebase is not configured on the server. Set FIREBASE_* env vars or enable DEMO_MODE.'
    );
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.authIdentity = {
      uid: decoded.uid,
      email: (decoded.email || '').toLowerCase(),
      name: decoded.name || '',
      picture: decoded.picture || '',
    };
    return next();
  } catch {
    throw httpError(401, 'Invalid or expired authentication token.');
  }
});

/**
 * Load the application User for the authenticated identity and attach as req.user.
 * The user must already exist (provisioned by an admin or the seed script) - we do
 * NOT self-provision arbitrary roles, which would be a privilege-escalation risk.
 */
export const loadUser = asyncHandler(async (req, _res, next) => {
  const { uid, email, name, picture } = req.authIdentity;
  let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });

  // Optional self-signup: create an account with a safe default role on first
  // login. Controlled by ALLOW_SELF_SIGNUP so a school can require provisioning.
  if (!user && env.allowSelfSignup) {
    const ROLES = ['student', 'parent', 'teacher', 'admin'];
    const role = ROLES.includes(env.selfSignupRole) ? env.selfSignupRole : 'parent';
    user = await User.create({
      email,
      firebaseUid: uid && !uid.startsWith('demo_') ? uid : undefined,
      displayName: name || email.split('@')[0],
      photoURL: picture || '',
      role,
    });
  }

  if (!user) throw httpError(403, 'No account provisioned for this identity. Contact your school admin.');

  // Bind the Firebase uid on first real login.
  if (!user.firebaseUid && uid && !uid.startsWith('demo_')) {
    user.firebaseUid = uid;
  }
  user.lastLoginAt = new Date();
  await user.save();

  req.user = user;
  next();
});

// Convenience: authenticate + loadUser in one.
export const requireAuth = [authenticate, loadUser];
