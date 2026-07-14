import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

// GET /api/auth/me - returns the current provisioned user profile.
export const getMe = asyncHandler(async (req, res) => {
  await req.user.populate([
    { path: 'children', select: 'displayName gradeLevel photoURL role' },
    { path: 'classroom', select: 'name gradeLevel' },
    { path: 'teachesClassrooms', select: 'name gradeLevel' },
  ]);
  res.json({ user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user });
});

// PATCH /api/auth/me - limited self-service profile updates (never role).
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['displayName', 'photoURL'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

// GET /api/auth/config - public, tells the client whether demo mode is on.
export const getPublicConfig = (_req, res) => {
  res.json({ demoMode: env.demoMode });
};

// GET /api/auth/org - the current organization (school), for header/branding.
export const getOrg = asyncHandler(async (_req, res) => {
  const School = (await import('../models/School.js')).default;
  const school = await School.findOne().lean();
  res.json({ org: school ? { id: school._id, name: school.name, timezone: school.timezone } : null });
});
