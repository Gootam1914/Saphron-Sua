# Saphron Sua

An all-in-one school communication platform for elementary (K–5) school communities. It centralizes messaging, ticketing, document sharing, event scheduling, feedback, and student rewards into one place, replacing the scattered mix of forms, email, calendars, and document tools that parents, students, teachers, and admins currently juggle.

## What it does

- **Role-specific dashboards** for Admin, Teacher, Parent, and Student, each showing recent activity, upcoming events, unread messages, and pending items.
- **Multi-tier messaging** - parent↔admin, parent↔teacher, student↔teacher (teacher-moderated), and teacher→class broadcasts. Students can only message teachers; there is no student-to-student messaging and no social feed.
- **Ticketing** - submit IT / facilities / general requests, track status (Open / In Progress / Resolved), with admin assignment, priority, and a full history trail.
- **Event calendar + RSVP** - monthly calendar, event categories, and parent RSVPs.
- **Document repository** - permission slips, newsletters, tardy slips, and policies with role-based access and parent digital acknowledgment/signature.
- **Surveys & feedback** - anonymous and scheduled surveys (weekly / post-lesson / end-of-class), an admin/teacher builder, and response analytics.
- **Rewards** - visual badge tracking for positive student behavior.
- **Notifications** - an in-app notification engine with per-user, per-type preferences.

## Tech stack

- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Backend:** Node.js + Express (REST API)
- **Database:** MongoDB via Mongoose
- **Auth:** Firebase Authentication with Google Workspace / school-account SSO

## Repository layout

```
saphron-sua/
├── client/                 React + Vite frontend
│   ├── src/
│   │   ├── components/      Reusable UI (common) + layout (shell, nav, route guard)
│   │   ├── context/         AuthContext (Firebase + demo mode)
│   │   ├── lib/             api client, firebase client
│   │   └── pages/           All screens (dashboards, messaging, tickets, …)
│   ├── tailwind.config.js   Design tokens (calm K-5 palette, kid + pro type scales)
│   └── .env.example
├── server/                 Express API
│   ├── src/
│   │   ├── config/          env, db, firebase-admin, multer upload
│   │   ├── models/          Mongoose schemas (User, Message, Ticket, …)
│   │   ├── middleware/       auth (token verify), rbac (role gate), error
│   │   ├── controllers/      business logic per domain
│   │   ├── routes/           REST routes per domain
│   │   ├── utils/            crypto (encryption at rest), moderation, notify
│   │   └── seed/             demo data seeding script
│   └── .env.example
├── docs/                   Setup, deployment, compliance, and status docs
└── README.md
```

## Quick start (for developers)

> A full, click-by-click guide written for non-coders is in **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)**.

```bash
# 1. Install everything
npm run install:all

# 2. Create env files (then fill them in - see the setup guide)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Seed demo data (requires MongoDB running / Atlas URI in server/.env)
npm run seed

# 4. Run both servers (in two terminals)
npm run dev:server      # http://localhost:5000
npm run dev:client      # http://localhost:5173
```

Open http://localhost:5173. With `DEMO_MODE=true` you can sign in instantly using the demo account buttons - no Firebase or passwords required.

### Demo accounts (demo mode)

| Role    | Email                     |
|---------|---------------------------|
| Admin   | admin@maplewood.edu       |
| Teacher | teacher@maplewood.edu     |
| Parent  | parent@maplewood.edu      |
| Student | student@maplewood.edu     |

## Safety, security & privacy

This is a product for young children, so safety is designed in, not bolted on:

- **Server-enforced role-based access control.** Every protected route checks the user's role from the database (`requireRole`). Hiding things in the UI is treated as cosmetic only.
- **Student message moderation.** Anything a student sends is screened by an automatic filter (profanity, bullying language, phone/email/address/link patterns) and placed in a teacher review queue. Nothing reaches the recipient until a teacher approves it - a review-before-delivery model.
- **Parental controls.** A parent is linked to their children and can review their child's activity; the schema supports message-history review.
- **Encryption.** HTTPS in transit is provided by the hosts (Render/Vercel). Message bodies are encrypted at rest with AES-256-GCM when `FIELD_ENCRYPTION_KEY` is set.
- **Compliance.** This product touches child data and would fall under COPPA / FERPA-type rules in a real deployment. See **[docs/COMPLIANCE.md](docs/COMPLIANCE.md)**. (These are engineering notes, not legal advice.)

## What is built vs. what still needs work

See **[docs/STATUS_CHECKLIST.md](docs/STATUS_CHECKLIST.md)** for a feature-by-feature breakdown mapped to the project backlog.
