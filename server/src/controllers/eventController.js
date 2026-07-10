import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Event, { RSVP_STATUSES } from '../models/Event.js';
import { notify } from '../utils/notify.js';

// GET /api/events - events visible to the current role, optional date range.
export const listEvents = asyncHandler(async (req, res) => {
  const me = req.user;
  const { from, to } = req.query;
  const filter = {
    $or: [{ audienceRoles: { $size: 0 } }, { audienceRoles: me.role }],
  };
  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = new Date(from);
    if (to) filter.startsAt.$lte = new Date(to);
  }
  const events = await Event.find(filter)
    .sort({ startsAt: 1 })
    .populate('createdBy', 'displayName role')
    .populate('classroom', 'name gradeLevel')
    .lean();

  const shaped = events.map((e) => ({
    ...e,
    myRsvp: e.rsvps?.find((r) => String(r.user) === String(me._id))?.status || null,
    rsvpCounts: (e.rsvps || []).reduce(
      (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
      {}
    ),
  }));
  res.json({ events: shaped });
});

// POST /api/events - teacher/admin creates an event.
export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, location, category, startsAt, endsAt, allDay, classroom, audienceRoles, rsvpEnabled, reminderMinutesBefore } = req.body;
  if (!title || !startsAt || !endsAt) throw httpError(400, 'title, startsAt, endsAt are required.');
  const event = await Event.create({
    title, description, location, category,
    startsAt, endsAt, allDay: !!allDay,
    classroom: classroom || undefined,
    audienceRoles: audienceRoles || [],
    rsvpEnabled: rsvpEnabled !== false,
    reminderMinutesBefore: reminderMinutesBefore ?? 1440,
    createdBy: req.user._id,
  });
  res.status(201).json({ event });
});

// PATCH /api/events/:id - update (creator or admin).
export const updateEvent = asyncHandler(async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) throw httpError(404, 'Event not found.');
  if (req.user.role !== 'admin' && String(e.createdBy) !== String(req.user._id)) {
    throw httpError(403, 'Only the creator or an admin may edit this event.');
  }
  const fields = ['title', 'description', 'location', 'category', 'startsAt', 'endsAt', 'allDay', 'audienceRoles', 'rsvpEnabled', 'reminderMinutesBefore'];
  for (const f of fields) if (req.body[f] !== undefined) e[f] = req.body[f];
  await e.save();
  res.json({ event: e });
});

// DELETE /api/events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) throw httpError(404, 'Event not found.');
  if (req.user.role !== 'admin' && String(e.createdBy) !== String(req.user._id)) {
    throw httpError(403, 'Not allowed.');
  }
  await e.deleteOne();
  res.json({ ok: true });
});

// POST /api/events/:id/rsvp - parent (or any audience) RSVPs.
export const rsvp = asyncHandler(async (req, res) => {
  const { status, guests = 0 } = req.body;
  if (!RSVP_STATUSES.includes(status)) throw httpError(400, `status must be one of ${RSVP_STATUSES.join(', ')}.`);
  const e = await Event.findById(req.params.id);
  if (!e) throw httpError(404, 'Event not found.');
  if (!e.rsvpEnabled) throw httpError(400, 'RSVP is not enabled for this event.');

  const existing = e.rsvps.find((r) => String(r.user) === String(req.user._id));
  if (existing) {
    existing.status = status;
    existing.guests = guests;
    existing.respondedAt = new Date();
  } else {
    e.rsvps.push({ user: req.user._id, status, guests, respondedAt: new Date() });
  }
  await e.save();

  if (String(e.createdBy) !== String(req.user._id)) {
    await notify(e.createdBy, {
      type: 'event',
      title: `RSVP: ${req.user.displayName} is ${status.replace('_', ' ')}`,
      body: e.title,
      link: '/events',
      refModel: 'Event',
      refId: e._id,
    });
  }
  res.json({ event: e });
});
