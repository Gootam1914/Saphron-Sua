import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Send, Plus, Megaphone, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Avatar, Chip, Spinner, EmptyState, Modal, Textarea, Select, Input } from '../components/common/ui.jsx';

export default function MessagingCenter() {
  const { conversationId } = useParams();
  const nav = useNavigate();
  const { role, profile } = useAuth();
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const loadList = () => api.get('/messages/conversations').then((d) => setConversations(d.conversations));
  useEffect(() => { loadList(); }, []);
  useEffect(() => {
    if (conversationId) api.get(`/messages/conversations/${conversationId}`).then(setActive).catch(() => setActive(null));
    else setActive(null);
  }, [conversationId]);

  const openConvo = (id) => nav(`/messages/${id}`);

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Your conversations"
        actions={
          <div className="flex gap-2">
            {(role === 'teacher') && (
              <Button variant="secondary" onClick={() => setBroadcastOpen(true)}><Megaphone size={16} /> Broadcast</Button>
            )}
            <Button onClick={() => setComposeOpen(true)}><Plus size={16} /> New message</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <Card className={`p-0 ${active ? 'hidden lg:block' : ''}`}>
          {!conversations ? <Spinner /> : conversations.length === 0 ? (
            <div className="p-4"><EmptyState icon={Send} title="No conversations yet" message="Start a new message to reach a teacher, parent or admin." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {conversations.map((c) => (
                <li key={c._id}>
                  <button onClick={() => openConvo(c._id)} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${active?.conversation?._id === c._id ? 'bg-brand-50/60' : ''}`}>
                    {c.type === 'broadcast'
                      ? <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron-100 text-saffron-600"><Megaphone size={18} /></div>
                      : <Avatar name={c.others?.[0]?.displayName || 'Group'} src={c.others?.[0]?.photoURL} />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-ink">{c.type === 'broadcast' ? c.subject : c.others?.map((o) => o.displayName).join(', ')}</p>
                        {c.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{c.unreadCount}</span>}
                      </div>
                      <p className="truncate text-xs text-slatey">{c.lastMessagePreview || 'No messages yet'}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Thread */}
        <Card className={`flex min-h-[60vh] flex-col p-0 ${!active ? 'hidden lg:flex' : ''}`}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6"><EmptyState icon={Send} title="Select a conversation" message="Choose a thread on the left, or start a new message." /></div>
          ) : (
            <Thread active={active} me={profile} onSent={() => { api.get(`/messages/conversations/${conversationId}`).then(setActive); loadList(); }} onBack={() => nav('/messages')} />
          )}
        </Card>
      </div>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} onDone={(id) => { setComposeOpen(false); loadList(); openConvo(id); }} />
      {role === 'teacher' && <BroadcastModal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} onDone={(id) => { setBroadcastOpen(false); loadList(); openConvo(id); }} />}
    </div>
  );
}

function Thread({ active, me, onSent, onBack }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const endRef = useRef(null);
  const { conversation, messages } = active;
  const isStudent = me.role === 'student';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true); setErr(null);
    try {
      await api.post(`/messages/conversations/${conversation._id}/messages`, { body: text });
      setText('');
      onSent();
    } catch (e2) { setErr(e2.message); } finally { setSending(false); }
  };

  const title = conversation.type === 'broadcast'
    ? conversation.subject
    : conversation.participants.filter((p) => p._id !== me._id).map((p) => p.displayName).join(', ');

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button className="rounded-lg p-1.5 text-slatey hover:bg-muted lg:hidden" onClick={onBack}><ArrowLeft size={18} /></button>
        <div>
          <p className="font-semibold text-ink">{title}</p>
          {conversation.type === 'broadcast' && <Chip tone="amber">Class announcement</Chip>}
        </div>
      </div>

      <div className={`flex-1 space-y-3 overflow-y-auto p-4 ${isStudent ? 'text-kid-base' : ''}`}>
        {messages.length === 0 && <p className="py-10 text-center text-sm text-slatey">No messages yet. Say hello!</p>}
        {messages.map((m) => {
          const mine = m.sender === me._id || m.sender?._id === me._id;
          const pending = ['pending', 'flagged'].includes(m.moderationStatus);
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-brand-600 text-white' : 'bg-muted text-ink'}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div className={`mt-1 flex items-center gap-1 text-[11px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {pending && <><Clock size={11} /> waiting for teacher review · </>}
                  {m.moderationStatus === 'rejected' && <>not delivered · </>}
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {conversation.type !== 'broadcast' && (
        <form onSubmit={send} className="border-t border-line p-3">
          {err && <p className="mb-2 text-sm text-rose-600">{err}</p>}
          {isStudent && <p className="mb-2 flex items-center gap-1 text-xs text-slatey"><ShieldCheck size={13} /> Your teacher reads every message before it is sent.</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
              rows={1}
              placeholder="Write a message…"
              className={`input flex-1 resize-none ${isStudent ? 'text-kid-base py-3' : ''}`}
            />
            <Button type="submit" loading={sending} className={isStudent ? 'py-3' : ''}><Send size={16} /> Send</Button>
          </div>
        </form>
      )}
    </>
  );
}

function ComposeModal({ open, onClose, onDone }) {
  const [recipients, setRecipients] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (open) api.get('/messages/recipients').then((d) => setRecipients(d.recipients)).catch(() => {}); }, [open]);

  const submit = async () => {
    if (!recipientId || !body.trim()) { setErr('Choose a recipient and write a message.'); return; }
    setBusy(true); setErr(null);
    try {
      const { conversationId } = await api.post('/messages/conversations', { recipientId, body });
      setBody(''); setRecipientId('');
      onDone(conversationId);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New message" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Send</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Select label="To" value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
          <option value="">Select a recipient…</option>
          {recipients.map((r) => <option key={r._id} value={r._id}>{r.displayName} ({r.role})</option>)}
        </Select>
        <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your message…" />
      </div>
    </Modal>
  );
}

function BroadcastModal({ open, onClose, onDone }) {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) api.get('/auth/me').then((d) => setClassrooms(d.user.teachesClassrooms || [])).catch(() => {});
  }, [open]);

  const submit = async () => {
    if (!classroomId || !body.trim()) { setErr('Choose a class and write a message.'); return; }
    setBusy(true); setErr(null);
    try {
      const { conversationId } = await api.post('/messages/broadcast', { classroomId, subject: subject || 'Class announcement', body });
      onDone(conversationId);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Broadcast to a class" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Send announcement</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Select label="Class" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
          <option value="">Select a class…</option>
          {classrooms.map((c) => <option key={c._id} value={c._id}>{c.name} (Grade {c.gradeLevel})</option>)}
        </Select>
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Field trip reminder" />
        <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="This goes to all parents and students in the class." />
      </div>
    </Modal>
  );
}
