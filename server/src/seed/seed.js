/**
 * Seed script - populates the database with demo users of every role plus
 * sample messages, tickets, events, documents, surveys, badges and rewards.
 *
 * Run with:  npm run seed   (from /server)
 *
 * It connects to MONGODB_URI. With DEMO_MODE=true the seeded users can be used
 * immediately via the demo login buttons (no Firebase needed).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { encrypt } from '../utils/crypto.js';

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

const days = (n) => new Date(Date.now() + n * 86400e3);
const hours = (n) => new Date(Date.now() + n * 3600e3);

async function wipe() {
  await Promise.all([
    User.deleteMany({}), School.deleteMany({}), Classroom.deleteMany({}),
    Message.deleteMany({}), Conversation.deleteMany({}), Ticket.deleteMany({}),
    Event.deleteMany({}), DocumentModel.deleteMany({}), Survey.deleteMany({}),
    Reward.deleteMany({}), Badge.deleteMany({}), Notification.deleteMany({}),
  ]);
}

async function run() {
  await connectDB();
  console.log('[seed] clearing existing data...');
  await wipe();

  const school = await School.create({ name: 'Maplewood Elementary', emailDomain: 'maplewood.edu', timezone: 'America/New_York' });

  // ---- Users ----
  console.log('[seed] creating users...');
  const admin = await User.create({ email: 'admin@maplewood.edu', displayName: 'Dana Okafor', role: 'admin', school: school._id });
  // Real admin account (signs in via Google SSO).
  await User.create({ email: 'gkanakadandi@gmail.com', displayName: 'Goutam Kanakadandi', role: 'admin', school: school._id });
  const teacher = await User.create({ email: 'teacher@maplewood.edu', displayName: 'Mr. Reyes', role: 'teacher', school: school._id });
  const teacher2 = await User.create({ email: 'teacher2@maplewood.edu', displayName: 'Ms. Bennett', role: 'teacher', school: school._id });

  const parent = await User.create({ email: 'parent@maplewood.edu', displayName: 'Priya Sharma', role: 'parent', school: school._id });
  const parent2 = await User.create({ email: 'parent2@maplewood.edu', displayName: 'Marcus Lee', role: 'parent', school: school._id });

  const student = await User.create({ email: 'student@maplewood.edu', displayName: 'Aanya Sharma', role: 'student', gradeLevel: '3', school: school._id, guardians: [parent._id] });
  const student2 = await User.create({ email: 'student2@maplewood.edu', displayName: 'Ethan Lee', role: 'student', gradeLevel: '3', school: school._id, guardians: [parent2._id] });
  const student3 = await User.create({ email: 'student3@maplewood.edu', displayName: 'Zoe Carter', role: 'student', gradeLevel: '2', school: school._id });

  parent.children = [student._id];
  parent2.children = [student2._id];
  await parent.save();
  await parent2.save();

  // ---- Classroom ----
  const room = await Classroom.create({ name: 'Room 3B', gradeLevel: '3', teacher: teacher._id, students: [student._id, student2._id], school: school._id });
  const room2 = await Classroom.create({ name: 'Room 2A', gradeLevel: '2', teacher: teacher2._id, students: [student3._id], school: school._id });
  teacher.teachesClassrooms = [room._id];
  teacher2.teachesClassrooms = [room2._id];
  await teacher.save();
  await teacher2.save();
  student.classroom = room._id; student2.classroom = room._id; student3.classroom = room2._id;
  await student.save(); await student2.save(); await student3.save();

  // ---- Badges ----
  console.log('[seed] creating badges + rewards...');
  const badges = await Badge.insertMany([
    { key: 'kindness', label: 'Kindness Star', description: 'Being kind to classmates', icon: 'heart', color: 'grape', points: 10 },
    { key: 'reader', label: 'Super Reader', description: 'Great reading progress', icon: 'book-open', color: 'sky', points: 15 },
    { key: 'helper', label: 'Class Helper', description: 'Helping the teacher and friends', icon: 'hand-helping', color: 'grass', points: 10 },
    { key: 'math', label: 'Math Whiz', description: 'Excellent math work', icon: 'calculator', color: 'saffron', points: 15 },
    { key: 'attendance', label: 'Perfect Attendance', description: 'Here every day this week', icon: 'calendar-check', color: 'sun', points: 20 },
  ]);
  const byKey = Object.fromEntries(badges.map((b) => [b.key, b]));

  await Reward.insertMany([
    { student: student._id, badge: byKey.kindness._id, awardedBy: teacher._id, reason: 'Helped a friend who was upset.', points: 10, awardedAt: days(-3) },
    { student: student._id, badge: byKey.reader._id, awardedBy: teacher._id, reason: 'Finished the reading challenge!', points: 15, awardedAt: days(-1) },
    { student: student._id, badge: byKey.math._id, awardedBy: teacher._id, reason: 'Perfect score on the times tables.', points: 15, awardedAt: hours(-5) },
    { student: student2._id, badge: byKey.helper._id, awardedBy: teacher._id, reason: 'Tidied the reading corner.', points: 10, awardedAt: days(-2) },
  ]);

  // ---- Messages: parent <-> teacher DM ----
  console.log('[seed] creating conversations + messages...');
  const convo1 = await Conversation.create({ type: 'dm', participants: [parent._id, teacher._id], subject: 'Reading at home' });
  const m1 = encrypt('Hi Mr. Reyes, how is Aanya doing with her reading this week?');
  const m2 = encrypt('She is doing wonderfully - she just earned the Super Reader badge!');
  await Message.create({ conversation: convo1._id, sender: parent._id, body: m1.value, encrypted: m1.encrypted, moderationStatus: 'not_required', readBy: [parent._id, teacher._id] });
  await Message.create({ conversation: convo1._id, sender: teacher._id, body: m2.value, encrypted: m2.encrypted, moderationStatus: 'not_required', readBy: [teacher._id] });
  convo1.lastMessagePreview = 'She is doing wonderfully...'; convo1.lastMessageAt = new Date(); convo1.unread.set(parent._id.toString(), 1);
  await convo1.save();

  // ---- Messages: student -> teacher (moderation demo) ----
  const convo2 = await Conversation.create({ type: 'dm', participants: [student._id, teacher._id], subject: 'Question about homework' });
  const s1 = encrypt('Mr. Reyes, do we need to finish page 12 tonight?');
  await Message.create({ conversation: convo2._id, sender: student._id, moderator: teacher._id, body: s1.value, encrypted: s1.encrypted, moderationStatus: 'pending', visibleToRecipient: false, readBy: [student._id] });
  const s2 = encrypt('You are so stupid');
  await Message.create({ conversation: convo2._id, sender: student._id, moderator: teacher._id, body: s2.value, encrypted: s2.encrypted, moderationStatus: 'flagged', flaggedTerms: ['stupid'], visibleToRecipient: false, readBy: [student._id] });
  convo2.lastMessagePreview = '(message pending teacher review)'; convo2.lastMessageAt = new Date();
  await convo2.save();

  // ---- Broadcast: teacher -> class ----
  const convo3 = await Conversation.create({ type: 'broadcast', participants: [teacher._id, parent._id, parent2._id, student._id, student2._id], classroom: room._id, subject: 'Field trip next Friday' });
  const b1 = encrypt('Reminder: our zoo field trip is next Friday. Please return permission slips by Wednesday!');
  await Message.create({ conversation: convo3._id, sender: teacher._id, body: b1.value, encrypted: b1.encrypted, moderationStatus: 'not_required', readBy: [teacher._id] });
  convo3.lastMessagePreview = 'Reminder: our zoo field trip...'; convo3.lastMessageAt = new Date();
  convo3.unread.set(parent._id.toString(), 1); convo3.unread.set(parent2._id.toString(), 1);
  await convo3.save();

  // ---- Tickets ----
  console.log('[seed] creating tickets...');
  await Ticket.create({
    title: 'Projector not working in Room 3B', description: 'The ceiling projector will not turn on.', category: 'it', priority: 'high', status: 'in_progress',
    submittedBy: teacher._id, assignedTo: admin._id,
    history: [
      { by: teacher._id, action: 'created', note: 'Ticket submitted.', at: days(-2) },
      { by: admin._id, action: 'status:open->in_progress', note: 'IT notified.', at: days(-1) },
    ],
  });
  await Ticket.create({
    title: 'Cafeteria door lock sticking', description: 'The side cafeteria door is hard to lock.', category: 'facilities', priority: 'medium', status: 'open',
    submittedBy: parent._id,
    history: [{ by: parent._id, action: 'created', note: 'Ticket submitted.' }],
  });
  await Ticket.create({
    title: 'Question about lunch menu', description: 'Where can I find the allergen list?', category: 'general', priority: 'low', status: 'resolved', resolvedAt: days(-1),
    submittedBy: parent2._id, assignedTo: admin._id,
    history: [
      { by: parent2._id, action: 'created', at: days(-3) },
      { by: admin._id, action: 'comment', note: 'Allergen list is posted on the Documents page.', at: days(-2) },
      { by: admin._id, action: 'status:open->resolved', at: days(-1) },
    ],
  });

  // ---- Events ----
  console.log('[seed] creating events...');
  const ev1 = await Event.create({ title: 'Zoo Field Trip', description: 'Grade 3 trip to the city zoo.', location: 'City Zoo', category: 'field_trip', startsAt: days(7), endsAt: days(7), createdBy: teacher._id, classroom: room._id, audienceRoles: ['parent', 'student'], reminderMinutesBefore: 1440 });
  ev1.rsvps.push({ user: parent._id, status: 'going', guests: 1 });
  await ev1.save();
  await Event.create({ title: 'PTA Monthly Meeting', description: 'Open to all families.', location: 'School Auditorium', category: 'pta', startsAt: days(3), endsAt: days(3), createdBy: admin._id, audienceRoles: [], reminderMinutesBefore: 2880 });
  await Event.create({ title: 'Spring Concert', description: 'Students perform for families.', location: 'Gymnasium', category: 'school_wide', startsAt: days(14), endsAt: days(14), createdBy: admin._id, audienceRoles: [] });

  // ---- Documents (metadata only; no backing files in demo) ----
  console.log('[seed] creating documents...');
  await DocumentModel.create({ title: 'Zoo Field Trip Permission Slip', description: 'Please sign to allow your child to attend.', docType: 'permission_slip', fileName: 'zoo-permission-slip.pdf', storageKey: 'demo-zoo-permission-slip.pdf', mimeType: 'application/pdf', uploadedBy: teacher._id, classroom: room._id, visibleToRoles: ['parent'], requiresAcknowledgement: true });
  await DocumentModel.create({ title: 'October Newsletter', description: 'School news for the month.', docType: 'newsletter', fileName: 'october-newsletter.pdf', storageKey: 'demo-october-newsletter.pdf', mimeType: 'application/pdf', uploadedBy: admin._id, visibleToRoles: [] });
  await DocumentModel.create({ title: 'Family Handbook & Policies', description: 'Attendance, dress code, and safety policies.', docType: 'policy', fileName: 'family-handbook.pdf', storageKey: 'demo-family-handbook.pdf', mimeType: 'application/pdf', uploadedBy: admin._id, visibleToRoles: [] });

  // ---- Surveys ----
  console.log('[seed] creating surveys...');
  const survey = await Survey.create({
    title: 'Weekly Family Check-in', description: 'Help us improve communication.', createdBy: admin._id,
    audienceRoles: ['parent'], anonymous: true, cadence: 'weekly', status: 'open',
    questions: [
      { prompt: 'How well informed do you feel about your child\'s week?', type: 'rating', scaleMax: 5, required: true },
      { prompt: 'Which channel do you prefer for updates?', type: 'single_choice', options: ['In-app messages', 'Email', 'Both'], required: true },
      { prompt: 'Anything else you\'d like us to know?', type: 'long_text' },
    ],
  });
  survey.responses.push({ answers: [ { questionId: survey.questions[0]._id, value: 4 }, { questionId: survey.questions[1]._id, value: 'Both' } ], submittedAt: days(-1) });
  survey.responses.push({ answers: [ { questionId: survey.questions[0]._id, value: 5 }, { questionId: survey.questions[1]._id, value: 'In-app messages' } ], submittedAt: hours(-6) });
  await survey.save();

  await Survey.create({
    title: 'Post-Lesson Feedback (Math)', description: 'Quick check after today\'s lesson.', createdBy: teacher._id,
    audienceRoles: ['parent'], anonymous: false, cadence: 'post_lesson', status: 'draft',
    questions: [ { prompt: 'Did your child understand today\'s lesson?', type: 'yes_no', required: true } ],
  });

  // ---- Notifications ----
  console.log('[seed] creating notifications...');
  await Notification.insertMany([
    { recipient: parent._id, type: 'message', title: 'New message from Mr. Reyes', body: 'She is doing wonderfully...', link: `/messages/${convo1._id}` },
    { recipient: parent._id, type: 'announcement', title: 'Announcement: Field trip next Friday', body: 'Reminder: our zoo field trip...', link: `/messages/${convo3._id}` },
    { recipient: teacher._id, type: 'moderation', title: 'A student message needs review', body: 'Open the moderation queue.', link: '/messages' },
    { recipient: student._id, type: 'reward', title: 'You earned the Math Whiz!', body: 'Perfect score on the times tables.', link: '/rewards' },
    { recipient: admin._id, type: 'ticket', title: 'New ticket: Cafeteria door lock sticking', body: 'Facilities • medium priority', link: '/tickets' },
  ]);

  console.log('\n[seed] Done. Demo accounts (password-less in DEMO_MODE):');
  console.log('  admin@maplewood.edu    (Admin)');
  console.log('  teacher@maplewood.edu  (Teacher)');
  console.log('  parent@maplewood.edu   (Parent)');
  console.log('  student@maplewood.edu  (Student)');

  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  try { await mongoose.disconnect(); } catch { /* noop */ }
  process.exit(1);
});
