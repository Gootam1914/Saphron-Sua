import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import User, { ROLES } from '../models/User.js';
import Classroom from '../models/Classroom.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import Survey from '../models/Survey.js';
import Message from '../models/Message.js';

// GET /api/admin/users - list/search users.
export const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ displayName: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const users = await User.find(filter).sort({ displayName: 1 }).limit(500).lean();
  res.json({ users });
});

// POST /api/admin/users - provision a user (assign role).
export const createUser = asyncHandler(async (req, res) => {
  const { email, displayName, role, gradeLevel, classroom, children, guardians } = req.body;
  if (!email || !displayName || !role) throw httpError(400, 'email, displayName, role are required.');
  if (!ROLES.includes(role)) throw httpError(400, 'Invalid role.');
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw httpError(409, 'A user with that email already exists.');
  const user = await User.create({
    email, displayName, role,
    gradeLevel, classroom: classroom || undefined,
    children: children || [], guardians: guardians || [],
  });
  res.status(201).json({ user });
});

// PATCH /api/admin/users/:id - update role / relationships / active state.
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found.');
  const fields = ['displayName', 'role', 'gradeLevel', 'classroom', 'children', 'guardians', 'isActive', 'parentalMonitoringEnabled'];
  for (const f of fields) if (req.body[f] !== undefined) user[f] = req.body[f];
  if (req.body.role && !ROLES.includes(req.body.role)) throw httpError(400, 'Invalid role.');
  await user.save();
  res.json({ user });
});

// DELETE /api/admin/users/:id - soft delete (deactivate).
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found.');
  user.isActive = false;
  await user.save();
  res.json({ ok: true });
});

// GET /api/admin/classrooms
export const listClassrooms = asyncHandler(async (_req, res) => {
  const classrooms = await Classroom.find().populate('teacher', 'displayName').populate('students', 'displayName gradeLevel').lean();
  res.json({ classrooms });
});

// GET /api/admin/analytics - school-wide metrics for the dashboard.
export const getAnalytics = asyncHandler(async (_req, res) => {
  const [usersByRole, ticketsByStatus, ticketAgg, eventParticipation, surveyStats, flaggedMessages] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } } },
      { $group: { _id: null, avgHours: { $avg: '$hours' }, count: { $sum: 1 } } },
    ]),
    Event.aggregate([
      { $project: { title: 1, going: { $size: { $filter: { input: '$rsvps', cond: { $eq: ['$$this.status', 'going'] } } } } } },
      { $sort: { going: -1 } },
      { $limit: 5 },
    ]),
    Survey.aggregate([{ $project: { title: 1, responses: { $size: '$responses' }, status: 1 } }, { $sort: { responses: -1 } }, { $limit: 5 }]),
    Message.countDocuments({ moderationStatus: 'flagged' }),
  ]);

  res.json({
    usersByRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
    ticketsByStatus: Object.fromEntries(ticketsByStatus.map((r) => [r._id, r.count])),
    avgResolutionHours: ticketAgg[0]?.avgHours ? +ticketAgg[0].avgHours.toFixed(1) : null,
    resolvedCount: ticketAgg[0]?.count || 0,
    topEvents: eventParticipation,
    topSurveys: surveyStats,
    flaggedMessages,
  });
});
