import { asyncHandler } from '../utils/asyncHandler.js';
import Message, { Conversation } from '../models/Message.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import Reward from '../models/Reward.js';
import Survey from '../models/Survey.js';
import User from '../models/User.js';

// GET /api/dashboard - role-tailored summary payload.
export const getDashboard = asyncHandler(async (req, res) => {
  const me = req.user;
  const now = new Date();

  // Shared: unread notifications + count, upcoming events, unread messages.
  const [unreadNotifications, upcomingEvents, myConversations] = await Promise.all([
    Notification.countDocuments({ recipient: me._id, read: false }),
    Event.find({ startsAt: { $gte: now } }).sort({ startsAt: 1 }).limit(5).lean(),
    Conversation.find({ participants: me._id }).lean(),
  ]);

  let unreadMessages = 0;
  for (const c of myConversations) {
    const u = c.unread?.[me._id.toString()] || 0;
    unreadMessages += u;
  }

  const base = {
    role: me.role,
    unreadNotifications,
    unreadMessages,
    upcomingEvents,
  };

  if (me.role === 'admin') {
    const [openTickets, inProgress, resolvedToday, totalUsers, pendingModeration, openSurveys] = await Promise.all([
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'resolved', resolvedAt: { $gte: new Date(now - 24 * 3600e3) } }),
      User.countDocuments({ isActive: true }),
      Message.countDocuments({ moderationStatus: 'flagged' }),
      Survey.countDocuments({ status: 'open' }),
    ]);
    return res.json({
      ...base,
      tickets: { open: openTickets, inProgress, resolvedToday },
      totalUsers,
      pendingModeration,
      openSurveys,
    });
  }

  if (me.role === 'teacher') {
    const classIds = me.teachesClassrooms || [];
    const [pendingModeration, myTickets, mySurveys] = await Promise.all([
      Message.countDocuments({ moderator: me._id, moderationStatus: { $in: ['pending', 'flagged'] } }),
      Ticket.countDocuments({ submittedBy: me._id, status: { $ne: 'resolved' } }),
      Survey.countDocuments({ createdBy: me._id }),
    ]);
    return res.json({ ...base, pendingModeration, myOpenTickets: myTickets, mySurveys, classroomCount: classIds.length });
  }

  if (me.role === 'parent') {
    const childIds = me.children || [];
    const [openTickets, childRewards] = await Promise.all([
      Ticket.countDocuments({ submittedBy: me._id, status: { $ne: 'resolved' } }),
      Reward.countDocuments({ student: { $in: childIds } }),
    ]);
    const children = await User.find({ _id: { $in: childIds } }).select('displayName gradeLevel photoURL').lean();
    return res.json({ ...base, myOpenTickets: openTickets, children, childRewardCount: childRewards });
  }

  // student
  const myRewards = await Reward.find({ student: me._id }).populate('badge').sort({ awardedAt: -1 }).limit(6).lean();
  const points = myRewards.reduce((s, r) => s + (r.points || 0), 0);
  return res.json({ ...base, recentBadges: myRewards, totalPoints: points });
});
