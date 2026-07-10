import mongoose from 'mongoose';
import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Message, { Conversation } from '../models/Message.js';
import User from '../models/User.js';
import { screenText } from '../utils/moderation.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { notify } from '../utils/notify.js';

// ---- Permission matrix (server-authoritative) ----
// Who may start/participate in a DM with whom.
//   parent  <-> teacher, admin
//   teacher <-> parent, student, admin
//   student <-> teacher ONLY  (moderated). No student<->student.
//   admin   <-> everyone
const ALLOWED = {
  parent: ['teacher', 'admin'],
  teacher: ['parent', 'student', 'admin'],
  student: ['teacher'],
  admin: ['parent', 'teacher', 'student', 'admin'],
};

function canDM(fromRole, toRole) {
  return ALLOWED[fromRole]?.includes(toRole);
}

function decryptBody(m) {
  const body = decrypt(m.body, m.encrypted);
  return { ...m, body, encrypted: undefined };
}

// GET /api/messages/conversations - list my threads.
export const listConversations = asyncHandler(async (req, res) => {
  const me = req.user;
  const convos = await Conversation.find({ participants: me._id })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'displayName role photoURL')
    .populate('classroom', 'name gradeLevel')
    .lean();
  const shaped = convos.map((c) => ({
    ...c,
    unreadCount: c.unread?.[me._id.toString()] || 0,
    others: c.participants.filter((p) => p._id.toString() !== me._id.toString()),
  }));
  res.json({ conversations: shaped });
});

// GET /api/messages/conversations/:id - messages in a thread (with moderation rules).
export const getConversation = asyncHandler(async (req, res) => {
  const me = req.user;
  const convo = await Conversation.findById(req.params.id)
    .populate('participants', 'displayName role photoURL')
    .populate('classroom', 'name gradeLevel');
  if (!convo) throw httpError(404, 'Conversation not found.');

  const isParticipant = convo.participants.some((p) => p._id.toString() === me._id.toString());
  // Teachers moderating and admins may view even if not a listed participant.
  if (!isParticipant && me.role !== 'admin') throw httpError(403, 'You are not part of this conversation.');

  const raw = await Message.find({ conversation: convo._id }).sort({ createdAt: 1 }).lean();

  // Visibility filter:
  //  - The recipient only sees student messages that are approved.
  //  - The sender always sees their own messages (with status).
  //  - Teacher-moderators and admins see everything.
  const filtered = raw.filter((m) => {
    if (m.moderationStatus === 'not_required' || m.moderationStatus === 'approved') return true;
    const mine = m.sender.toString() === me._id.toString();
    const moderatorHere = me.role === 'teacher' || me.role === 'admin';
    return mine || moderatorHere;
  });

  // Mark my unread as read.
  convo.unread.set(me._id.toString(), 0);
  await convo.save();
  await Message.updateMany(
    { conversation: convo._id, readBy: { $ne: me._id } },
    { $addToSet: { readBy: me._id } }
  );

  res.json({ conversation: convo, messages: filtered.map(decryptBody) });
});

// POST /api/messages/conversations - start (or reuse) a DM and send first message.
export const startConversation = asyncHandler(async (req, res) => {
  const me = req.user;
  const { recipientId, body, subject = '' } = req.body;
  if (!recipientId || !body) throw httpError(400, 'recipientId and body are required.');

  const recipient = await User.findById(recipientId);
  if (!recipient) throw httpError(404, 'Recipient not found.');
  if (!canDM(me.role, recipient.role)) {
    throw httpError(403, `A ${me.role} may not message a ${recipient.role}.`);
  }

  // Reuse an existing 1:1 thread if present.
  let convo = await Conversation.findOne({
    type: 'dm',
    participants: { $all: [me._id, recipient._id], $size: 2 },
  });
  if (!convo) {
    convo = await Conversation.create({
      type: 'dm',
      participants: [me._id, recipient._id],
      subject,
    });
  }

  const message = await sendInThread({ me, recipient, convo, body });
  res.status(201).json({ conversationId: convo._id, message: decryptBody(message.toObject()) });
});

// POST /api/messages/conversations/:id/messages - reply in a thread.
export const postMessage = asyncHandler(async (req, res) => {
  const me = req.user;
  const { body } = req.body;
  if (!body) throw httpError(400, 'body is required.');
  const convo = await Conversation.findById(req.params.id).populate('participants', 'role');
  if (!convo) throw httpError(404, 'Conversation not found.');
  if (!convo.participants.some((p) => p._id.toString() === me._id.toString())) {
    throw httpError(403, 'You are not part of this conversation.');
  }
  const recipient = convo.participants.find((p) => p._id.toString() !== me._id.toString());
  if (recipient && !canDM(me.role, recipient.role)) {
    throw httpError(403, `A ${me.role} may not message a ${recipient.role}.`);
  }
  const message = await sendInThread({ me, recipient, convo, body });
  res.status(201).json({ message: decryptBody(message.toObject()) });
});

// Core send routine shared by start/reply. Applies moderation when sender is a student.
async function sendInThread({ me, recipient, convo, body }) {
  const enc = encrypt(body);

  const doc = {
    conversation: convo._id,
    sender: me._id,
    body: enc.value,
    encrypted: enc.encrypted,
    readBy: [me._id],
  };

  if (me.role === 'student') {
    // Route through moderation: find the student's teacher-moderator.
    const screen = screenText(body);
    doc.moderationStatus = screen.status; // 'pending' | 'flagged'
    doc.flaggedTerms = screen.flaggedTerms;
    doc.visibleToRecipient = false;
    // Moderator = the recipient teacher (student may only message teachers).
    doc.moderator = recipient?._id;
  } else {
    doc.moderationStatus = 'not_required';
    doc.visibleToRecipient = true;
  }

  const message = await Message.create(doc);

  // Update conversation metadata + unread counters.
  convo.lastMessageAt = new Date();
  convo.lastMessagePreview = me.role === 'student' && doc.moderationStatus !== 'approved'
    ? '(message pending teacher review)'
    : body.slice(0, 80);
  if (recipient) {
    // Student messages don't bump recipient unread until approved.
    if (!(me.role === 'student')) {
      const key = recipient._id.toString();
      convo.unread.set(key, (convo.unread.get(key) || 0) + 1);
    }
  }
  await convo.save();

  // Notifications
  if (me.role === 'student' && recipient) {
    await notify(recipient._id, {
      type: 'moderation',
      title: 'A student message needs review',
      body: 'Open the moderation queue to approve or reject.',
      link: '/messages',
      refModel: 'Message',
      refId: message._id,
    });
  } else if (recipient) {
    await notify(recipient._id, {
      type: 'message',
      title: `New message from ${me.displayName}`,
      body: body.slice(0, 100),
      link: `/messages/${convo._id}`,
      refModel: 'Conversation',
      refId: convo._id,
    });
  }

  return message;
}

// ---- Moderation queue (teacher/admin) ----

// GET /api/messages/moderation - pending/flagged student messages for this teacher.
export const listModeration = asyncHandler(async (req, res) => {
  const me = req.user;
  const filter = { moderationStatus: { $in: ['pending', 'flagged'] } };
  if (me.role === 'teacher') filter.moderator = me._id;
  const items = await Message.find(filter)
    .sort({ createdAt: 1 })
    .populate('sender', 'displayName gradeLevel photoURL')
    .populate('conversation', 'participants')
    .lean();
  res.json({ items: items.map(decryptBody) });
});

// POST /api/messages/moderation/:id - approve or reject a student message.
export const moderateMessage = asyncHandler(async (req, res) => {
  const me = req.user;
  const { decision, note = '' } = req.body; // 'approve' | 'reject'
  const message = await Message.findById(req.params.id).populate('conversation');
  if (!message) throw httpError(404, 'Message not found.');
  if (me.role === 'teacher' && String(message.moderator) !== String(me._id)) {
    throw httpError(403, 'You are not the moderator for this message.');
  }
  if (!['approve', 'reject'].includes(decision)) throw httpError(400, 'decision must be approve or reject.');

  message.moderationStatus = decision === 'approve' ? 'approved' : 'rejected';
  message.visibleToRecipient = decision === 'approve';
  message.moderatedBy = me._id;
  message.moderatedAt = new Date();
  message.moderatorNote = note;
  await message.save();

  if (decision === 'approve') {
    const convo = message.conversation;
    const recipientId = convo.participants.find((p) => p.toString() !== message.sender.toString());
    if (recipientId) {
      convo.unread.set(recipientId.toString(), (convo.unread.get(recipientId.toString()) || 0) + 1);
      convo.lastMessagePreview = decrypt(message.body, message.encrypted).slice(0, 80);
      convo.lastMessageAt = new Date();
      await convo.save();
      await notify(recipientId, {
        type: 'message',
        title: 'New message',
        body: 'A student message was approved and delivered.',
        link: `/messages/${convo._id}`,
      });
    }
  }
  // Notify the student of the outcome.
  await notify(message.sender, {
    type: 'moderation',
    title: decision === 'approve' ? 'Your message was sent' : 'Your message was not sent',
    body: note || (decision === 'approve' ? 'Your teacher approved your message.' : 'Please try rewording your message.'),
    link: '/messages',
  });

  res.json({ ok: true, message: decryptBody(message.toObject()) });
});

// ---- Broadcast (teacher -> class) ----

// POST /api/messages/broadcast - teacher announcement to a classroom.
export const broadcast = asyncHandler(async (req, res) => {
  const me = req.user;
  const { classroomId, subject = 'Class announcement', body } = req.body;
  if (!classroomId || !body) throw httpError(400, 'classroomId and body are required.');

  const enc = encrypt(body);
  const convo = await Conversation.create({
    type: 'broadcast',
    participants: [me._id],
    classroom: classroomId,
    subject,
    lastMessageAt: new Date(),
    lastMessagePreview: body.slice(0, 80),
  });
  const message = await Message.create({
    conversation: convo._id,
    sender: me._id,
    body: enc.value,
    encrypted: enc.encrypted,
    moderationStatus: 'not_required',
    readBy: [me._id],
  });

  // Notify parents + students of the class.
  const Classroom = mongoose.model('Classroom');
  const classroom = await Classroom.findById(classroomId).populate('students', '_id guardians');
  const recipientIds = new Set();
  for (const s of classroom?.students || []) {
    recipientIds.add(s._id.toString());
    (s.guardians || []).forEach((g) => recipientIds.add(g.toString()));
  }
  for (const rid of recipientIds) {
    convo.participants.addToSet(rid);
    await notify(rid, {
      type: 'announcement',
      title: `Announcement: ${subject}`,
      body: body.slice(0, 100),
      link: `/messages/${convo._id}`,
    });
  }
  await convo.save();

  res.status(201).json({ conversationId: convo._id, message: decryptBody(message.toObject()) });
});

// GET /api/messages/recipients - who the current user is allowed to message.
export const listRecipients = asyncHandler(async (req, res) => {
  const me = req.user;
  const allowedRoles = ALLOWED[me.role] || [];
  let query = { role: { $in: allowedRoles }, isActive: true, _id: { $ne: me._id } };

  // Students may only message teachers who teach them.
  if (me.role === 'student') {
    await me.populate('classroom');
    const teacherIds = me.classroom ? [me.classroom.teacher] : [];
    query = { _id: { $in: teacherIds } };
  }
  const users = await User.find(query).select('displayName role photoURL gradeLevel').limit(200).lean();
  res.json({ recipients: users });
});
