import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Notification from '../models/Notification.js';

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const { unread } = req.query;
  const filter = { recipient: req.user._id };
  if (unread === 'true') filter.read = false;
  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);
  res.json({ notifications: items, unreadCount });
});

// POST /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );
  if (!n) throw httpError(404, 'Notification not found.');
  res.json({ notification: n });
});

// POST /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

// GET /api/notifications/settings  &  PATCH to update prefs.
export const getSettings = asyncHandler(async (req, res) => {
  res.json({ notificationPrefs: req.user.notificationPrefs });
});
export const updateSettings = asyncHandler(async (req, res) => {
  const prefs = req.user.notificationPrefs || {};
  const keys = ['messages', 'tickets', 'events', 'announcements', 'surveys', 'rewards', 'channel'];
  for (const k of keys) if (req.body[k] !== undefined) prefs[k] = req.body[k];
  req.user.notificationPrefs = prefs;
  await req.user.save();
  res.json({ notificationPrefs: req.user.notificationPrefs });
});
