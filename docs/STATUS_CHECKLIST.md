# Build Status Checklist

Mapped to the task backlog (`Tasks for Sua - Sheet1.csv`). Legend: **Built** = working code in this repo; **Mock/Stub** = works but backed by placeholder or simplified logic; **To do** = needs real work before a school could rely on it.

## Fully built (working code)

| Task | Feature | Notes |
|------|---------|-------|
| 3.1 | Parent–Admin messaging | DM with server-side permission matrix |
| 3.2 | Student messaging (moderated) | Screening filter + teacher review-before-delivery queue |
| 3.3 | Group announcements | Teacher → class broadcast to parents + students |
| 3.4 | Messaging frontend UI | Inbox, threads, compose, broadcast, moderation views |
| 3.5 | Ticket submission form | IT / facilities / general with priority |
| 3.6 | Ticket status tracking | Open / In Progress / Resolved + resolved timestamp |
| 3.7 | Ticket assignment logic | Admin assign + prioritize |
| 3.8 | Ticket history view | Full audit trail per ticket |
| 3.9 | Notification engine | In-app notifications on all key events |
| 3.10 | Notification settings UI | Per-type toggles + delivery channel preference |
| 4.1 | Document upload | Multer disk storage, type + size guards |
| 4.2 | Document access control | Role-based visibility, server-enforced |
| 4.3 | Document repository UI | Browse, filter, download, sign |
| 4.4 | Event creation | Teacher/admin, categories, audience targeting |
| 4.5 | Event RSVP | Going / maybe / not going + guest count |
| 4.6 | Calendar view UI | Monthly grid with event pills + detail modal |
| 4.8 | Survey builder | Admin/teacher builder, multiple question types |
| 4.9 | Survey response UI | Anonymous + attributed, per-type inputs |
| 4.10 | Survey analytics | Distributions, rating averages, text samples |
| 5.1 | User role management | Admin CRUD + role changes |
| 5.2 | Permissions system | `requireRole` middleware on every protected route |
| 5.3 | Admin analytics dashboard | Users by role, ticket stats, participation |
| 5.4 | Content management | Announcements, documents, events, surveys |
| 6.1 | Authentication system | Firebase token verify + demo-mode fallback |
| 6.3 | Parental controls | Parent↔child linkage; child activity/rewards visible |
| 6.4 | Message moderation | Auto-filter (profanity/PII/links) + teacher queue |
| 2.1–2.8 | Design + UX | Design tokens, role dashboards, all flows implemented |
| - | Rewards system | Badge catalog + awards + student rewards board |
| - | Seed script | Demo users of every role + sample data |

## Mock / stubbed (works, but simplified)

- **6.2 Data encryption** - AES-256-GCM field encryption for message bodies is implemented; broaden to other sensitive fields and move the key into a KMS/secrets manager. HTTPS is provided by the host, not the app.
- **Message moderation filter** - keyword/pattern baseline. Swap in a hosted toxicity/PII classifier for production (interface is ready in `utils/moderation.js`).
- **Notification delivery channel** - the preference (in-app / email / both) is stored and respected server-side, but only in-app notifications are actually delivered. Email/push needs a provider (e.g. SendGrid/FCM) wired into `utils/notify.js`.
- **Seed documents** - document records exist but have no backing files, so "Download" on seeded docs is a no-op until a real file is uploaded.
- **Real-time** - notifications and messages refresh on an interval (polling), not via websockets.
- **4.7 Calendar sync integration** - not implemented; the schema carries reminder fields but there is no external iCal/Google Calendar sync or reminder cron yet.

## To do before a real school uses it

- **Requirements/discovery (1.1–1.6):** stakeholder interviews, personas, success metrics, MVP prioritization - product work, not code.
- **4.7 External calendar sync** and scheduled reminder dispatch (a cron/worker).
- **7.1–7.2 Automated tests:** this repo ships an import-graph smoke test + unit tests for moderation/crypto; add a full Jest/Vitest suite and API integration tests.
- **7.3–7.6 Pilot & rollout:** pilot with a small group, collect feedback, then full deployment.
- **7.7 Maintenance:** monitoring, error tracking, backups, dependency updates.
- **Compliance hardening:** see `docs/COMPLIANCE.md` (consent flows, retention/deletion, audit logging, DPAs, pen test).
- **Attachments in messages** (if desired) with malware/image scanning.
- **Accessibility audit** (WCAG 2.1 AA) and multi-language support.

## Verification performed in this build

- `npm run build` (client) - passes.
- `npm run lint` (client) - passes (only intentional exhaustive-deps warnings remain).
- Backend import-graph check - all 22 modules (routes → controllers → models → middleware → utils) import cleanly.
- Unit tests - moderation filter (clean/profanity/PII) and at-rest encryption round-trip pass.

> A full live-DB run wasn't possible in the build sandbox (no MongoDB binary available), so exercise the API end-to-end locally by following Part A of the setup guide.
