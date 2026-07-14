/**
 * Seed script — idempotent and NON-destructive by default.
 *
 * Running `npm run seed` will:
 *   - ensure the owner admin account exists (created if missing, never duplicated), and
 *   - ensure the badge catalog exists (upserted by key).
 * It will NOT delete users, messages, tickets, or anything else, so accounts and
 * conversations persist across restarts and re-seeds.
 *
 * To wipe everything and start clean, run:  npm run seed -- --fresh
 * (All real data — accounts, messages, tickets — lives in MongoDB Atlas and
 *  persists between server restarts automatically; only --fresh clears it.)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';

import User from '../models/User.js';
import School from '../models/School.js';
import Classroom from '../models/Classroom.js';
import Message, { Conversation } from '../models/Message.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import DocumentModel from '../models/Document.js';
import Survey from '../models/Survey.js';
import Reward, { Badge } from '../models/Reward.js';
import Notification from '../models/Notification.js';

const OWNER_ADMIN = { email: 'gkanakadandi@gmail.com', displayName: 'Goutam Kanakadandi' };

const BADGES = [
  { key: 'kindness', label: 'Kindness Star', description: 'Being kind to classmates', icon: 'heart', color: 'grape', points: 10 },
  { key: 'reader', label: 'Super Reader', description: 'Great reading progress', icon: 'book-open', color: 'sky', points: 15 },
  { key: 'helper', label: 'Class Helper', description: 'Helping the teacher and friends', icon: 'hand-helping', color: 'grass', points: 10 },
  { key: 'math', label: 'Math Whiz', description: 'Excellent math work', icon: 'calculator', color: 'saffron', points: 15 },
  { key: 'attendance', label: 'Perfect Attendance', description: 'Here every day this week', icon: 'calendar-check', color: 'sun', points: 20 },
];

async function run() {
  const fresh = process.argv.includes('--fresh');
  await connectDB();

  if (fresh) {
    console.log('[seed] --fresh: wiping ALL collections...');
    await Promise.all([
      User.deleteMany({}), School.deleteMany({}), Classroom.deleteMany({}),
      Message.deleteMany({}), Conversation.deleteMany({}), Ticket.deleteMany({}),
      Event.deleteMany({}), DocumentModel.deleteMany({}), Survey.deleteMany({}),
      Reward.deleteMany({}), Badge.deleteMany({}), Notification.deleteMany({}),
    ]);
  }

  // Ensure the owner admin exists (upsert by email; never duplicated, never overwrites role changes).
  const existing = await User.findOne({ email: OWNER_ADMIN.email.toLowerCase() });
  if (!existing) {
    await User.create({ email: OWNER_ADMIN.email.toLowerCase(), displayName: OWNER_ADMIN.displayName, role: 'admin' });
    console.log(`[seed] created owner admin: ${OWNER_ADMIN.email}`);
  } else {
    console.log(`[seed] owner admin already present: ${OWNER_ADMIN.email}`);
  }

  // Ensure badge catalog exists (upsert by key; preserves any edits you make).
  for (const b of BADGES) {
    await Badge.updateOne({ key: b.key }, { $setOnInsert: b }, { upsert: true });
  }
  console.log('[seed] badge catalog ensured.');

  const counts = {
    users: await User.countDocuments(),
    conversations: await Conversation.countDocuments(),
    messages: await Message.countDocuments(),
  };
  console.log(`[seed] Done. Persisted totals -> users: ${counts.users}, conversations: ${counts.conversations}, messages: ${counts.messages}`);

  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  try { await mongoose.disconnect(); } catch { /* noop */ }
  process.exit(1);
});
