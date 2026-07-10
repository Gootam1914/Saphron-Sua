import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create an in-app notification, respecting the recipient's per-type preference.
 * (Email/push delivery would hook in here in production; we persist in-app.)
 */
export async function notify(recipientId, { type, title, body = '', link = '', refModel, refId }) {
  try {
    const user = await User.findById(recipientId).select('notificationPrefs');
    const prefs = user?.notificationPrefs || {};
    const map = {
      message: prefs.messages,
      ticket: prefs.tickets,
      event: prefs.events,
      announcement: prefs.announcements,
      survey: prefs.surveys,
      reward: prefs.rewards,
      moderation: true, // safety notifications are always delivered
      document: true,
    };
    if (map[type] === false) return null;
    return await Notification.create({ recipient: recipientId, type, title, body, link, refModel, refId });
  } catch (err) {
    console.warn('[notify] failed:', err.message);
    return null;
  }
}

export async function notifyMany(recipientIds, payload) {
  return Promise.all([...new Set(recipientIds.map(String))].map((id) => notify(id, payload)));
}
