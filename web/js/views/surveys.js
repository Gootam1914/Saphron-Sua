import { el, icon, spinner, empty, modal, toast } from '../ui.js';
import { api } from '../api.js';

export default function surveysView({ profile }) {
  const canBuild = profile.role === 'teacher' || profile.role === 'admin';
  const root = el('div', {});
  const grid = el('div', {}, spinner('Loading surveys'));

  const load = () => api.get('/surveys').then(({ surveys }) => {
    if (!surveys.length) { grid.replaceChildren(empty('No surveys', canBuild ? 'Create one to collect feedback.' : 'Surveys shared with you appear here.')); return; }
    grid.replaceChildren(el('div', { class: 'grid grid--2' }, surveys.map((s) => {
      const mine = canBuild;
      return el('div', { class: 'card' }, [
        el('div', { style: 'display:flex;justify-content:space-between;gap:8px' }, [
          el('div', {}, [el('b', { text: s.title }), el('div', { class: 'helper', text: `${s.anonymous ? 'Anonymous' : 'Attributed'} · ${s.cadence.replace('_', ' ')} · ${(s.questions || []).length} questions` })]),
          el('span', { class: 'chip ' + (s.status === 'open' ? 'chip--green' : s.status === 'draft' ? 'chip--mute' : 'chip--gold'), text: s.status }),
        ]),
        s.description ? el('div', { class: 'helper', style: 'margin-top:6px', text: s.description }) : null,
        el('div', { style: 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap' }, [
          s.status === 'open' && !s.respondedByMe ? el('button', { class: 'btn btn--gold btn--sm', text: 'Respond', onclick: () => respond(s) }) : null,
          s.respondedByMe ? el('span', { class: 'chip chip--green', html: icon('check', 12) + ' Responded' }) : null,
          mine ? el('button', { class: 'btn btn--ghost btn--sm', text: 'Results (' + (s.responseCount || 0) + ')', onclick: () => analytics(s) }) : null,
          mine ? el('button', { class: 'btn btn--ghost btn--sm', text: s.status === 'open' ? 'Close' : 'Open', onclick: async () => { await api.patch('/surveys/' + s._id, { status: s.status === 'open' ? 'closed' : 'open' }); load(); } }) : null,
        ]),
      ]);
    })));
  }).catch((e) => grid.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  function respond(s) {
    const answers = {};
    const q = (question) => {
      const id = question._id; const box = el('div', {});
      if (question.type === 'rating') box.append(el('div', { style: 'display:flex;gap:6px' }, Array.from({ length: question.scaleMax || 5 }, (_, i) => i + 1).map((n) => el('button', { class: 'btn btn--ghost btn--sm', text: String(n), onclick: (e) => { answers[id] = n; [...e.target.parentNode.children].forEach((c) => c.className = 'btn btn--ghost btn--sm'); e.target.className = 'btn btn--gold btn--sm'; } }))));
      else if (question.type === 'yes_no') box.append(el('div', { style: 'display:flex;gap:8px' }, ['Yes', 'No'].map((o) => el('button', { class: 'chip chip--mute', text: o, onclick: (e) => { answers[id] = o; [...e.target.parentNode.children].forEach((c) => c.className = 'chip chip--mute'); e.target.className = 'chip chip--gold'; } }))));
      else if (question.type === 'single_choice') box.append(el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, question.options.map((o) => el('button', { class: 'chip chip--mute', text: o, onclick: (e) => { answers[id] = o; [...e.target.parentNode.children].forEach((c) => c.className = 'chip chip--mute'); e.target.className = 'chip chip--gold'; } }))));
      else { const inp = question.type === 'long_text' ? el('textarea', { class: 'textarea' }) : el('input', { class: 'input' }); inp.oninput = () => { answers[id] = inp.value; }; box.append(inp); }
      return el('div', {}, [el('div', { style: 'font-weight:600;margin-bottom:6px', text: question.prompt + (question.required ? ' *' : '') }), box]);
    };
    const m = modal({ size: 'lg', title: s.title, body: [
      s.anonymous ? el('div', { class: 'chip chip--gold', text: 'Your answers are anonymous' }) : null,
      ...s.questions.map(q),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Submit', onclick: async () => {
      const miss = s.questions.filter((qq) => qq.required && (answers[qq._id] === undefined || answers[qq._id] === '')); if (miss.length) { toast('Answer all required questions', 'err'); return; }
      try { await api.post('/surveys/' + s._id + '/respond', { answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })) }); m.close(); toast('Response submitted'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  async function analytics(s) {
    let data; try { data = await api.get('/surveys/' + s._id + '/analytics'); } catch (e) { toast(e.message, 'err'); return; }
    modal({ size: 'lg', title: 'Results: ' + data.title, body: [
      el('div', { class: 'helper', text: data.totalResponses + ' response(s)' + (data.anonymous ? ' · anonymous' : '') }),
      ...data.perQuestion.map((q) => el('div', {}, [
        el('div', { style: 'font-weight:600;margin-bottom:6px', text: q.prompt }),
        q.summary.type === 'rating' ? el('div', {}, [el('b', { style: 'font-size:22px;color:var(--gold)', text: q.summary.avg }), el('span', { class: 'helper', text: ' average (' + q.summary.count + ')' })])
          : q.summary.type === 'distribution' ? el('div', { style: 'display:grid;gap:6px' }, Object.entries(q.summary.counts).map(([opt, n]) => el('div', {}, [el('div', { style: 'display:flex;justify-content:space-between;font-size:13px' }, [el('span', { text: opt }), el('span', { class: 'helper', text: String(n) })]), el('div', { class: 'bar' }, el('i', { style: 'width:' + (data.totalResponses ? Math.round(n / data.totalResponses * 100) : 0) + '%' }))])))
          : el('div', { class: 'list' }, (q.summary.samples || []).length ? q.summary.samples.map((t) => el('div', { style: 'background:var(--card-2);padding:8px 10px;border-radius:10px;font-size:13px', text: t })) : [el('span', { class: 'helper', text: 'No responses yet.' })]),
      ])),
    ] });
  }

  function build() {
    const meta = { title: el('input', { class: 'input' }), desc: el('textarea', { class: 'textarea' }),
      cadence: el('select', { class: 'select' }, ['one_time', 'weekly', 'monthly', 'post_lesson', 'end_of_class'].map((v) => el('option', { value: v, text: v.replace('_', ' ') }))),
      audience: el('select', { class: 'select' }, ['parent', 'teacher', 'student'].map((v) => el('option', { value: v, text: v }))),
      anon: el('input', { type: 'checkbox', checked: true }) };
    const qWrap = el('div', { style: 'display:grid;gap:10px' });
    const questions = [];
    const addQ = () => { const q = { prompt: el('input', { class: 'input', placeholder: 'Question ' + (questions.length + 1) }), type: el('select', { class: 'select' }, ['rating', 'yes_no', 'single_choice', 'multiple_choice', 'short_text', 'long_text'].map((v) => el('option', { value: v, text: v.replace('_', ' ') }))), opts: el('input', { class: 'input', placeholder: 'Options, comma separated' }) };
      questions.push(q); qWrap.append(el('div', { style: 'background:var(--card-2);padding:10px;border-radius:12px;display:grid;gap:8px' }, [q.prompt, el('div', { style: 'display:flex;gap:8px' }, [q.type, q.opts])])); };
    addQ();
    const m = modal({ size: 'lg', title: 'Build a survey', body: [
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Title' }), meta.title]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Description' }), meta.desc]),
      el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }, [el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Cadence' }), meta.cadence]), el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Audience' }), meta.audience])]),
      el('label', { style: 'display:flex;gap:8px;align-items:center' }, [meta.anon, el('span', { class: 'helper', text: 'Anonymous responses' })]),
      el('div', {}, [el('div', { class: 'helper', style: 'margin-bottom:6px', text: 'Questions' }), qWrap, el('button', { class: 'btn btn--ghost btn--sm', style: 'margin-top:8px', html: icon('plus', 14) + ' Add question', onclick: addQ })]),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Publish', onclick: async () => {
      if (!meta.title.value || questions.some((q) => !q.prompt.value)) { toast('Add a title and fill every question', 'err'); return; }
      const payload = { title: meta.title.value, description: meta.desc.value, cadence: meta.cadence.value, audienceRoles: [meta.audience.value], anonymous: meta.anon.checked, status: 'open',
        questions: questions.map((q) => ({ prompt: q.prompt.value, type: q.type.value, options: q.opts.value ? q.opts.value.split(',').map((s) => s.trim()).filter(Boolean) : [], scaleMax: 5, required: false })) };
      try { await api.post('/surveys', payload); m.close(); toast('Survey published'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'SURVEYS' }), el('p', { text: 'Gather and analyze feedback' })]),
    canBuild ? el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' New survey', onclick: build }) : null,
  ]), grid);
  load();
  return root;
}
