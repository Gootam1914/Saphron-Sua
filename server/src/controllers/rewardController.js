import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Reward, { Badge } from '../models/Reward.js';
import User from '../models/User.js';
import { notify, notifyMany } from '../utils/notify.js';

// GET /api/rewards/badges - badge catalog.
export const listBadges = asyncHandler(async (_req, res) => {
  const badges = await Badge.find().sort({ points: 1 }).lean();
  res.json({ badges });
});

// GET /api/rewards - awards. Students see their own; parents see their children's;
// teachers/admins can query by student.
export const listRewards = asyncHandler(async (req, res) => {
  const me = req.user;
  let studentIds;
  if (me.role === 'student') studentIds = [me._id];
  else if (me.role === 'parent') studentIds = me.children || [];
  else if (req.query.student) studentIds = [req.query.student];

  const filter = studentIds ? { student: { $in: studentIds } } : {};
  const rewards = await Reward.find(filter)
    .sort({ awardedAt: -1 })
    .populate('badge')
    .populate('student', 'displayName gradeLevel photoURL')
    .populate('awardedBy', 'displayName role')
    .lean();

  const totalPoints = rewards.reduce((s, r) => s + (r.points || 0), 0);
  res.json({ rewards, totalPoints });
});

// POST /api/rewards - teacher/admin grants a badge to a student.
export const grantReward = asyncHandler(async (req, res) => {
  const { studentId, badgeKey, reason = '' } = req.body;
  if (!studentId || !badgeKey) throw httpError(400, 'studentId and badgeKey are required.');
  const [student, badge] = await Promise.all([
    User.findById(studentId),
    Badge.findOne({ key: badgeKey }),
  ]);
  if (!student || student.role !== 'student') throw httpError(404, 'Student not found.');
  if (!badge) throw httpError(404, 'Badge not found.');

  const reward = await Reward.create({
    student: student._id,
    badge: badge._id,
    awardedBy: req.user._id,
    reason,
    points: badge.points,
  });
  await reward.populate('badge');

  await notify(student._id, {
    type: 'reward',
    title: `You earned the ${badge.label}!`,
    body: reason || 'Great job!',
    link: '/rewards',
    refModel: 'Reward',
    refId: reward._id,
  });
  await notifyMany(student.guardians || [], {
    type: 'reward',
    title: `${student.displayName} earned the ${badge.label}`,
    body: reason || '',
    link: '/rewards',
  });

  res.status(201).json({ reward });
});

// POST /api/rewards/badges - admin creates a badge type.
export const createBadge = asyncHandler(async (req, res) => {
  const { key, label, description = '', icon = 'star', color = 'sun', points = 10 } = req.body;
  if (!key || !label) throw httpError(400, 'key and label are required.');
  const badge = await Badge.create({ key, label, description, icon, color, points });
  res.status(201).json({ badge });
});
