/**
 * Seed script — clean slate.
 *
 * Wipes every collection and creates ONLY:
 *   1) the real admin account (signs in via Google/SSO), and
 *   2) the badge catalog (reusable reward definitions, not fabricated activity).
 *
 * No demo users, messages, tickets, events, documents, surveys, or notifications
 * are created. Run with:  npm run seed  (from /server)
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

// The first/owner admin account. Everyone else is added from Admin > Users.
const OWNER_ADMIN = { email: 'gkanakadandi@gmail.com', displayName: 'Goutam Kanakadandi' };

async function run() {
  await connectDB();

  console.log('[seed] wiping all collections (removing any demo/fake data)...');
  await Promise.all([
    User.deleteMany({}), School.deleteMany({}), Classroom.deleteMany({}),
    Message.deleteMany({}), Conversation.deleteMany({}), Ticket.deleteMany({}),
    Event.deleteMany({}), DocumentModel.deleteMany({}), Survey.deleteMany({}),
    Reward.deleteMany({}), Badge.deleteMany({}), Notification.deleteMany({}),
  ]);

  console.log('[seed] creating the owner admin account...');
  await User.create({ email: OWNER_ADMIN.email.toLowerCase(), displayName: OWNER_ADMIN.displayName, role: 'admin' });

  console.log('[seed] creating the badge catalog...');
  await Badge.insertMany([
    { key: 'kindness', label: 'Kindness Star', description: 'Being kind to classmates', icon: 'heart', color: 'grape', points: 10 },
    { key: 'reader', label: 'Super Reader', description: 'Great reading progress', icon: 'book-open', color: 'sky', points: 15 },
    { key: 'helper', label: 'Class Helper', description: 'Helping the teacher and friends', icon: 'hand-helping', color: 'grass', points: 10 },
    { key: 'math', label: 'Math Whiz', description: 'Excellent math work', icon: 'calculator', color: 'saffron', points: 15 },
    { key: 'attendance', label: 'Perfect Attendance', description: 'Here every day this week', icon: 'calendar-check', color: 'sun', points: 20 },
  ]);

  console.log('\n[seed] Done. Database is clean.');
  console.log(`  Admin: ${OWNER_ADMIN.email}`);
  console.log('  Add all other users from Admin > Users, or let them self-sign-up (ALLOW_SELF_SIGNUP).');

  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  try { await mongoose.disconnect(); } catch { /* noop */ }
  process.exit(1);
});
