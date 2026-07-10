import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Ticket, { TICKET_STATUSES, TICKET_PRIORITIES } from '../models/Ticket.js';
import { notify } from '../utils/notify.js';
import { isAdmin } from '../middleware/rbac.js';

// GET /api/tickets - admins see all; others see their own.
export const listTickets = asyncHandler(async (req, res) => {
  const me = req.user;
  const { status, category, assignedTo } = req.query;
  const filter = {};
  if (!isAdmin(req)) filter.submittedBy = me._id;
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;

  const tickets = await Ticket.find(filter)
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'displayName role')
    .populate('assignedTo', 'displayName role')
    .lean();
  res.json({ tickets });
});

// GET /api/tickets/:id - full detail + history.
export const getTicket = asyncHandler(async (req, res) => {
  const t = await Ticket.findById(req.params.id)
    .populate('submittedBy', 'displayName role')
    .populate('assignedTo', 'displayName role')
    .populate('history.by', 'displayName role');
  if (!t) throw httpError(404, 'Ticket not found.');
  if (!isAdmin(req) && String(t.submittedBy._id) !== String(req.user._id)) {
    throw httpError(403, 'You may only view your own tickets.');
  }
  res.json({ ticket: t });
});

// POST /api/tickets - submit a ticket.
export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  if (!title || !description || !category) throw httpError(400, 'title, description, category are required.');
  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority: TICKET_PRIORITIES.includes(priority) ? priority : 'medium',
    submittedBy: req.user._id,
    history: [{ by: req.user._id, action: 'created', note: 'Ticket submitted.' }],
  });
  res.status(201).json({ ticket });
});

// PATCH /api/tickets/:id - admin updates status/priority/assignment.
export const updateTicket = asyncHandler(async (req, res) => {
  const t = await Ticket.findById(req.params.id);
  if (!t) throw httpError(404, 'Ticket not found.');
  const { status, priority, assignedTo, note } = req.body;
  const events = [];

  if (status && TICKET_STATUSES.includes(status) && status !== t.status) {
    events.push({ by: req.user._id, action: `status:${t.status}->${status}` });
    t.status = status;
    if (status === 'resolved') t.resolvedAt = new Date();
  }
  if (priority && TICKET_PRIORITIES.includes(priority) && priority !== t.priority) {
    events.push({ by: req.user._id, action: `priority:${t.priority}->${priority}` });
    t.priority = priority;
  }
  if (assignedTo !== undefined && String(assignedTo) !== String(t.assignedTo || '')) {
    events.push({ by: req.user._id, action: 'assigned', note: `Assigned to ${assignedTo}` });
    t.assignedTo = assignedTo || null;
  }
  if (note) events.push({ by: req.user._id, action: 'comment', note });

  t.history.push(...events);
  await t.save();

  if (events.length) {
    await notify(t.submittedBy, {
      type: 'ticket',
      title: `Ticket updated: ${t.title}`,
      body: `Status is now "${t.status}".`,
      link: `/tickets/${t._id}`,
      refModel: 'Ticket',
      refId: t._id,
    });
  }
  res.json({ ticket: t });
});

// POST /api/tickets/:id/comment - add a comment (submitter or admin).
export const commentTicket = asyncHandler(async (req, res) => {
  const t = await Ticket.findById(req.params.id);
  if (!t) throw httpError(404, 'Ticket not found.');
  if (!isAdmin(req) && String(t.submittedBy) !== String(req.user._id)) {
    throw httpError(403, 'Not allowed.');
  }
  const { note } = req.body;
  if (!note) throw httpError(400, 'note is required.');
  t.history.push({ by: req.user._id, action: 'comment', note });
  await t.save();
  res.json({ ticket: t });
});
