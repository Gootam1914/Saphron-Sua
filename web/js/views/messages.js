import { el, icon, avatar, spinner, empty, modal, toast, timeago } from '../ui.js';
import { api } from '../api.js';
import { navigate } from '../router.js';

export default function messagesView({ params, profile }) {
  const me = profile;
  const activeId = params.id || null;
  const wrap = el('div', { class: 'msg' + (activeId ? ' thread-open' : '') });
  const listPane = el('div', { class: 'msg__list' }, spinner('Loading'));
  const threadPane = el('div', { class: 'msg__thread' });
  wrap.append(listPane, threadPane);

  const head = el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'Messages' }), el('p', { text: 'Your conversations' })]),
    el('div', { style: 'display:flex;gap:10px' }, [
      me.role === 'teacher' ? el('button', { class: 'btn btn--ghost', html: icon('megaphone', 16) + ' Broadcast', onclick: openBroadcast }) : null,
      el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' New message', onclick: openCompose }),
    ]),
  ]);

  function loadList() {
    api.get('/messages/conversations').then(({ conversations }) => {
      if (!conversations.length) { listPane.replaceChildren(el('div', { style: 'padding:16px' }, empty('No conversations', 'Start a new message.'))); return; }
      listPane.replaceChildren(...conversations.map((c) => {
        const other = c.others?.[0];
        const name = c.type === 'broadcast' ? c.subject : (c.others || []).map((o) => o.displayName).join(', ') || 'Conversation';
        const av = c.type === 'broadcast'
          ? el('div', { class: 'avatar conv__av', style: 'background:linear-gradient(135deg,var(--coral),var(--gold))', html: icon('megaphone', 20) })
          : avatar(other?.displayName || name, 48);
        av.classList.add('conv__av');
        if (c.unreadCount > 0) av.appendChild(el('span', { class: 'conv__unreadbar' }));
        return el('a', { href: '#/messages/' + c._id, class: 'conv' + (c._id === activeId ? ' active' : '') }, [
          av,
          el('div', { class: 'conv__main' }, [
            el('div', { class: 'conv__name', text: name }),
            el('div', { class: 'conv__prev' + (c.unreadCount ? ' unread' : ''), text: c.lastMessagePreview || 'No messages yet' }),
          ]),
          el('small', { class: 'helper', text: c.lastMessageAt ? timeago(c.lastMessageAt) : '' }),
        ]);
      }));
    }).catch((e) => listPane.replaceChildren(el('div', { class: 'error-box', style: 'margin:16px', text: e.message })));
  }

  function loadThread() {
    if (!activeId) { threadPane.replaceChildren(el('div', { style: 'display:grid;place-items:center;height:100%' }, empty('Select a conversation', 'Pick a thread on the left.'))); return; }
    threadPane.replaceChildren(spinner('Loading messages'));
    api.get('/messages/conversations/' + activeId).then(({ conversation, messages }) => {
      const isBroadcast = conversation.type === 'broadcast';
      const title = isBroadcast ? conversation.subject : (conversation.participants || []).filter((p) => p._id !== me._id).map((p) => p.displayName).join(', ');
      const body = el('div', { class: 'thread__body' });
      messages.forEach((m) => {
        const mine = (m.sender?._id || m.sender) === me._id;
        const pending = ['pending', 'flagged'].includes(m.moderationStatus);
        const senderName = mine ? 'You' : (m.sender?.displayName || 'Them');
        body.appendChild(el('div', { class: 'bubble-wrap ' + (mine ? 'me' : 'them') }, [
          !mine ? el('div', { class: 'bubble-name', text: senderName }) : null,
          el('div', { class: 'bubble ' + (mine ? 'me' : 'them') + (m.moderationStatus === 'flagged' ? ' mod-flag' : ''), text: m.body }),
          el('div', { class: 'bubble__meta' }, [
            pending ? el('span', { class: 'mod-note', html: icon('shield', 11) + ' waiting for teacher review · ' }) : null,
            m.moderationStatus === 'rejected' ? el('span', { text: 'not delivered · ' }) : null,
            document.createTextNode(timeago(m.createdAt)),
          ]),
        ]));
      });

      const input = el('textarea', { class: 'textarea', rows: 1, placeholder: me.role === 'student' ? 'Message your teacher…' : 'Write a message…' });
      const sendBtn = el('button', { class: 'btn btn--gold', html: icon('send', 16),
        onclick: async () => {
          const text = input.value.trim(); if (!text) return;
          sendBtn.disabled = true;
          try { await api.post('/messages/conversations/' + activeId + '/messages', { body: text }); input.value = ''; loadThread(); loadList(); }
          catch (e) { toast(e.message, 'err'); } finally { sendBtn.disabled = false; }
        } });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });

      threadPane.replaceChildren(
        el('div', { class: 'thread__head' }, [
          el('button', { class: 'iconbtn', style: 'display:none', html: icon('back'), onclick: () => navigate('/messages') }),
          isBroadcast ? el('div', { class: 'avatar', style: 'width:40px;height:40px;background:linear-gradient(135deg,var(--coral),var(--gold))', html: icon('megaphone', 18) }) : avatar(title, 40),
          el('div', {}, [el('b', { text: title }), isBroadcast ? el('div', { class: 'chip chip--gold', style: 'margin-top:2px', text: 'Class announcement' }) : null]),
        ]),
        body,
        isBroadcast ? el('div', { style: 'padding:12px;text-align:center', class: 'helper', text: 'Announcements are one-way.' }) :
          el('div', {}, [
            me.role === 'student' ? el('div', { class: 'helper', style: 'padding:8px 14px 0', html: icon('shield', 12) + ' Your teacher reads every message before it sends.' }) : null,
            el('div', { class: 'compose' }, [input, sendBtn]),
          ]),
      );
      // show back button on mobile
      if (window.matchMedia('(max-width:820px)').matches) threadPane.querySelector('.iconbtn').style.display = 'inline-grid';
      body.scrollTop = body.scrollHeight;
    }).catch((e) => threadPane.replaceChildren(el('div', { class: 'error-box', style: 'margin:16px', text: e.message })));
  }

  function openCompose() {
    const sel = el('select', { class: 'select' }, [el('option', { value: '', text: 'Select a recipient…' })]);
    const body = el('textarea', { class: 'textarea', placeholder: 'Type your message…' });
    api.get('/messages/recipients').then(({ recipients }) => {
      recipients.forEach((r) => sel.appendChild(el('option', { value: r._id, text: `${r.displayName} (${r.role})` })));
    });
    const m = modal({
      title: 'New message',
      body: [el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'To' }), sel]), el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Message' }), body])],
      footer: [
        el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }),
        el('button', { class: 'btn btn--gold', text: 'Send', onclick: async (e) => {
          if (!sel.value || !body.value.trim()) { toast('Choose a recipient and write a message', 'err'); return; }
          e.target.disabled = true;
          try { const { conversationId } = await api.post('/messages/conversations', { recipientId: sel.value, body: body.value }); m.close(); navigate('/messages/' + conversationId); }
          catch (err) { toast(err.message, 'err'); e.target.disabled = false; }
        } }),
      ],
    });
  }

  function openBroadcast() {
    const sel = el('select', { class: 'select' }, [el('option', { value: '', text: 'Select a class…' })]);
    const subj = el('input', { class: 'input', placeholder: 'Subject (e.g. Field trip reminder)' });
    const body = el('textarea', { class: 'textarea', placeholder: 'Goes to all parents and students in the class.' });
    api.get('/auth/me').then(({ user }) => (user.teachesClassrooms || []).forEach((c) => sel.appendChild(el('option', { value: c._id, text: `${c.name} (Grade ${c.gradeLevel})` }))));
    const m = modal({
      title: 'Broadcast to a class',
      body: [
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Class' }), sel]),
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Subject' }), subj]),
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Message' }), body]),
      ],
      footer: [
        el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }),
        el('button', { class: 'btn btn--gold', text: 'Send announcement', onclick: async (e) => {
          if (!sel.value || !body.value.trim()) { toast('Choose a class and write a message', 'err'); return; }
          e.target.disabled = true;
          try { const { conversationId } = await api.post('/messages/broadcast', { classroomId: sel.value, subject: subj.value || 'Class announcement', body: body.value }); m.close(); navigate('/messages/' + conversationId); }
          catch (err) { toast(err.message, 'err'); e.target.disabled = false; }
        } }),
      ],
    });
  }

  loadList();
  loadThread();
  return el('div', {}, [head, wrap]);
}
