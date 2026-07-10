import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Survey from '../models/Survey.js';
import { notifyMany } from '../utils/notify.js';
import User from '../models/User.js';

// GET /api/surveys - open surveys for my role (+ my own drafts if creator).
export const listSurveys = asyncHandler(async (req, res) => {
  const me = req.user;
  let filter;
  if (me.role === 'admin' || me.role === 'teacher') {
    filter = { $or: [{ createdBy: me._id }, { status: 'open', $or: [{ audienceRoles: { $size: 0 } }, { audienceRoles: me.role }] }] };
  } else {
    filter = { status: 'open', $or: [{ audienceRoles: { $size: 0 } }, { audienceRoles: me.role }] };
  }
  const surveys = await Survey.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'displayName role').lean();
  const shaped = surveys.map((s) => ({
    ...s,
    // Hide raw responses from non-creators.
    responseCount: s.responses?.length || 0,
    respondedByMe: (s.responses || []).some((r) => String(r.respondent) === String(me._id)),
    responses: undefined,
    questions: s.questions,
  }));
  res.json({ surveys: shaped });
});

// GET /api/surveys/:id - a single survey (respondents get questions only).
export const getSurvey = asyncHandler(async (req, res) => {
  const s = await Survey.findById(req.params.id).populate('createdBy', 'displayName role');
  if (!s) throw httpError(404, 'Survey not found.');
  const isOwner = String(s.createdBy._id) === String(req.user._id) || req.user.role === 'admin';
  const obj = s.toObject();
  if (!isOwner) delete obj.responses;
  res.json({ survey: obj, isOwner });
});

// POST /api/surveys - admin/teacher builds a survey.
export const createSurvey = asyncHandler(async (req, res) => {
  const { title, description, audienceRoles, anonymous, cadence, opensAt, closesAt, questions, status } = req.body;
  if (!title || !Array.isArray(questions) || questions.length === 0) {
    throw httpError(400, 'title and at least one question are required.');
  }
  const survey = await Survey.create({
    title, description,
    audienceRoles: audienceRoles || [],
    anonymous: !!anonymous,
    cadence: cadence || 'one_time',
    opensAt: opensAt || new Date(),
    closesAt: closesAt || undefined,
    questions,
    status: status === 'open' ? 'open' : 'draft',
    createdBy: req.user._id,
  });

  if (survey.status === 'open') await notifyAudience(survey);
  res.status(201).json({ survey });
});

// PATCH /api/surveys/:id - update / open / close.
export const updateSurvey = asyncHandler(async (req, res) => {
  const s = await Survey.findById(req.params.id);
  if (!s) throw httpError(404, 'Survey not found.');
  if (req.user.role !== 'admin' && String(s.createdBy) !== String(req.user._id)) throw httpError(403, 'Not allowed.');
  const wasOpen = s.status === 'open';
  const fields = ['title', 'description', 'audienceRoles', 'anonymous', 'cadence', 'opensAt', 'closesAt', 'questions', 'status'];
  for (const f of fields) if (req.body[f] !== undefined) s[f] = req.body[f];
  await s.save();
  if (!wasOpen && s.status === 'open') await notifyAudience(s);
  res.json({ survey: s });
});

// POST /api/surveys/:id/respond - submit answers (anonymous or attributed).
export const respondSurvey = asyncHandler(async (req, res) => {
  const s = await Survey.findById(req.params.id);
  if (!s) throw httpError(404, 'Survey not found.');
  if (s.status !== 'open') throw httpError(400, 'This survey is not open.');
  const { answers } = req.body;
  if (!Array.isArray(answers)) throw httpError(400, 'answers array is required.');

  if (!s.anonymous) {
    const already = s.responses.some((r) => String(r.respondent) === String(req.user._id));
    if (already) throw httpError(409, 'You have already responded.');
  }
  s.responses.push({ respondent: s.anonymous ? undefined : req.user._id, answers, submittedAt: new Date() });
  await s.save();
  res.status(201).json({ ok: true, responseCount: s.responses.length });
});

// GET /api/surveys/:id/analytics - aggregated results (creator/admin only).
export const surveyAnalytics = asyncHandler(async (req, res) => {
  const s = await Survey.findById(req.params.id);
  if (!s) throw httpError(404, 'Survey not found.');
  if (req.user.role !== 'admin' && String(s.createdBy) !== String(req.user._id)) throw httpError(403, 'Not allowed.');

  const perQuestion = s.questions.map((q) => {
    const answers = s.responses.map((r) => r.answers.find((a) => String(a.questionId) === String(q._id))?.value).filter((v) => v !== undefined);
    let summary;
    if (['single_choice', 'multiple_choice', 'yes_no'].includes(q.type)) {
      const counts = {};
      for (const v of answers) {
        (Array.isArray(v) ? v : [v]).forEach((opt) => { counts[opt] = (counts[opt] || 0) + 1; });
      }
      summary = { type: 'distribution', counts };
    } else if (q.type === 'rating') {
      const nums = answers.map(Number).filter((n) => !Number.isNaN(n));
      summary = { type: 'rating', avg: nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : 0, count: nums.length };
    } else {
      summary = { type: 'text', samples: answers.slice(0, 50) };
    }
    return { questionId: q._id, prompt: q.prompt, qType: q.type, responses: answers.length, summary };
  });

  res.json({ title: s.title, totalResponses: s.responses.length, anonymous: s.anonymous, perQuestion });
});

async function notifyAudience(survey) {
  const roleFilter = survey.audienceRoles?.length ? { role: { $in: survey.audienceRoles } } : {};
  const users = await User.find({ ...roleFilter, isActive: true }).select('_id').lean();
  await notifyMany(users.map((u) => u._id), {
    type: 'survey',
    title: `New survey: ${survey.title}`,
    body: survey.anonymous ? 'Your feedback is anonymous.' : 'Please share your feedback.',
    link: `/surveys/${survey._id}`,
    refModel: 'Survey',
    refId: survey._id,
  });
}
