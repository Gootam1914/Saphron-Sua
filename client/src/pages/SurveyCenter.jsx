import { useEffect, useState } from 'react';
import { ClipboardList, Plus, BarChart3, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Chip, Spinner, EmptyState, Modal, Input, Textarea, Select } from '../components/common/ui.jsx';

const STATUS_TONE = { draft: 'gray', open: 'green', closed: 'amber' };

export default function SurveyCenter() {
  const { role } = useAuth();
  const canBuild = role === 'teacher' || role === 'admin';
  const [surveys, setSurveys] = useState(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [respond, setRespond] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const load = () => api.get('/surveys').then((d) => setSurveys(d.surveys));
  useEffect(() => { load(); }, []);

  const openAnalytics = async (s) => {
    const a = await api.get(`/surveys/${s._id}/analytics`);
    setAnalytics(a);
  };
  const toggleStatus = async (s) => {
    await api.patch(`/surveys/${s._id}`, { status: s.status === 'open' ? 'closed' : 'open' });
    load();
  };

  return (
    <div>
      <PageHeader title="Surveys & feedback" subtitle="Gather and analyze responses" actions={canBuild ? <Button onClick={() => setBuildOpen(true)}><Plus size={16} /> New survey</Button> : null} />

      {!surveys ? <Spinner /> : surveys.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No surveys" message={canBuild ? 'Create a survey to collect feedback.' : 'Surveys shared with you will appear here.'} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {surveys.map((s) => {
            const mine = canBuild && (s.createdBy?.role === role || role === 'admin');
            return (
              <Card key={s._id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-xs text-slatey">{s.anonymous ? 'Anonymous' : 'Attributed'} · {s.cadence.replace('_', ' ')} · {s.questions?.length || 0} questions</p>
                  </div>
                  <Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip>
                </div>
                {s.description && <p className="mt-2 text-sm text-slatey">{s.description}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {s.status === 'open' && !s.respondedByMe && <Button onClick={() => setRespond(s)}>Respond</Button>}
                  {s.respondedByMe && <Chip tone="green"><CheckCircle2 size={13} /> Responded</Chip>}
                  {mine && <Button variant="secondary" onClick={() => openAnalytics(s)}><BarChart3 size={15} /> Results ({s.responseCount})</Button>}
                  {mine && <Button variant="ghost" onClick={() => toggleStatus(s)}>{s.status === 'open' ? 'Close' : 'Open'}</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {canBuild && <BuildModal open={buildOpen} onClose={() => setBuildOpen(false)} onDone={() => { setBuildOpen(false); load(); }} />}
      <RespondModal survey={respond} onClose={() => setRespond(null)} onDone={() => { setRespond(null); load(); }} />
      <AnalyticsModal data={analytics} onClose={() => setAnalytics(null)} />
    </div>
  );
}

function BuildModal({ open, onClose, onDone }) {
  const [meta, setMeta] = useState({ title: '', description: '', anonymous: true, cadence: 'one_time', audienceRoles: ['parent'], status: 'open' });
  const [questions, setQuestions] = useState([{ prompt: '', type: 'rating', options: [], scaleMax: 5, required: true }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const addQ = () => setQuestions([...questions, { prompt: '', type: 'short_text', options: [], required: false }]);
  const updateQ = (i, patch) => setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQ = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!meta.title || questions.some((q) => !q.prompt)) { setErr('Add a title and fill in every question prompt.'); return; }
    setBusy(true); setErr(null);
    try {
      const payload = {
        ...meta,
        questions: questions.map((q) => ({ ...q, options: typeof q.options === 'string' ? q.options.split(',').map((s) => s.trim()).filter(Boolean) : q.options })),
      };
      await api.post('/surveys', payload);
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Build a survey" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Publish</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Input label="Title" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        <Textarea label="Description" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Cadence" value={meta.cadence} onChange={(e) => setMeta({ ...meta, cadence: e.target.value })}>
            <option value="one_time">One time</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            <option value="post_lesson">After each lesson</option><option value="end_of_class">End of class</option>
          </Select>
          <Select label="Audience" value={meta.audienceRoles[0]} onChange={(e) => setMeta({ ...meta, audienceRoles: [e.target.value] })}>
            <option value="parent">Parents</option><option value="teacher">Teachers</option><option value="student">Students</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slatey">
          <input type="checkbox" checked={meta.anonymous} onChange={(e) => setMeta({ ...meta, anonymous: e.target.checked })} /> Anonymous responses
        </label>

        <div className="space-y-3 rounded-xl border border-line p-3">
          <p className="text-sm font-semibold text-ink">Questions</p>
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2">
                <Input value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })} placeholder={`Question ${i + 1}`} className="flex-1" />
                <button onClick={() => removeQ(i)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Select value={q.type} onChange={(e) => updateQ(i, { type: e.target.value })}>
                  <option value="rating">Rating (1–5)</option><option value="yes_no">Yes / No</option>
                  <option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option>
                  <option value="short_text">Short text</option><option value="long_text">Long text</option>
                </Select>
                {['single_choice', 'multiple_choice'].includes(q.type) && (
                  <Input value={Array.isArray(q.options) ? q.options.join(', ') : q.options} onChange={(e) => updateQ(i, { options: e.target.value })} placeholder="Options, comma separated" className="flex-1" />
                )}
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addQ}><Plus size={15} /> Add question</Button>
        </div>
      </div>
    </Modal>
  );
}

function RespondModal({ survey, onClose, onDone }) {
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  if (!survey) return null;

  const setA = (qid, value) => setAnswers({ ...answers, [qid]: value });
  const toggleMulti = (qid, opt) => {
    const cur = answers[qid] || [];
    setA(qid, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
  };

  const submit = async () => {
    const missing = survey.questions.filter((q) => q.required && (answers[q._id] === undefined || answers[q._id] === ''));
    if (missing.length) { setErr('Please answer all required questions.'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/surveys/${survey._id}/respond`, { answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })) });
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={!!survey} onClose={onClose} size="lg" title={survey.title} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Submit</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      {survey.anonymous && <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Your answers are anonymous.</p>}
      <div className="space-y-4">
        {survey.questions.map((q) => (
          <div key={q._id}>
            <p className="mb-1.5 font-medium text-ink">{q.prompt}{q.required && <span className="text-rose-500"> *</span>}</p>
            {q.type === 'rating' && (
              <div className="flex gap-1">
                {Array.from({ length: q.scaleMax || 5 }, (_, n) => n + 1).map((n) => (
                  <button key={n} onClick={() => setA(q._id, n)} className={`h-10 w-10 rounded-lg font-semibold ${answers[q._id] === n ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>{n}</button>
                ))}
              </div>
            )}
            {q.type === 'yes_no' && (
              <div className="flex gap-2">
                {['Yes', 'No'].map((o) => <button key={o} onClick={() => setA(q._id, o)} className={`chip ${answers[q._id] === o ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>{o}</button>)}
              </div>
            )}
            {q.type === 'single_choice' && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => <button key={o} onClick={() => setA(q._id, o)} className={`chip ${answers[q._id] === o ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>{o}</button>)}
              </div>
            )}
            {q.type === 'multiple_choice' && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => <button key={o} onClick={() => toggleMulti(q._id, o)} className={`chip ${(answers[q._id] || []).includes(o) ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>{o}</button>)}
              </div>
            )}
            {q.type === 'short_text' && <Input value={answers[q._id] || ''} onChange={(e) => setA(q._id, e.target.value)} />}
            {q.type === 'long_text' && <Textarea value={answers[q._id] || ''} onChange={(e) => setA(q._id, e.target.value)} />}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function AnalyticsModal({ data, onClose }) {
  if (!data) return null;
  return (
    <Modal open={!!data} onClose={onClose} size="lg" title={`Results: ${data.title}`}>
      <p className="mb-4 text-sm text-slatey">{data.totalResponses} response(s){data.anonymous ? ' · anonymous' : ''}</p>
      <div className="space-y-5">
        {data.perQuestion.map((q) => (
          <div key={q.questionId}>
            <p className="mb-2 font-medium text-ink">{q.prompt}</p>
            {q.summary.type === 'rating' && (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-brand-600">{q.summary.avg}</span>
                <span className="text-sm text-slatey">average ({q.summary.count} responses)</span>
              </div>
            )}
            {q.summary.type === 'distribution' && (
              <div className="space-y-1.5">
                {Object.entries(q.summary.counts).map(([opt, n]) => {
                  const pct = data.totalResponses ? Math.round((n / data.totalResponses) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="flex justify-between text-sm"><span className="text-ink">{opt}</span><span className="text-slatey">{n}</span></div>
                      <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
            {q.summary.type === 'text' && (
              <ul className="space-y-1">
                {q.summary.samples.length === 0 && <li className="text-sm text-slate-400">No responses yet.</li>}
                {q.summary.samples.map((s, i) => <li key={i} className="rounded-lg bg-muted px-3 py-2 text-sm text-ink">{s}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
