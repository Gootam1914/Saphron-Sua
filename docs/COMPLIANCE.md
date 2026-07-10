# Child-Data Compliance Notes

These are engineering notes to flag where Saphron Sua touches regulated child data. They are **not legal advice** - a real deployment should be reviewed by the school district's counsel and privacy officer.

## Why this matters here

Saphron Sua is built for K–5 students, i.e. children under 13. That brings two US frameworks into play (and analogues elsewhere, e.g. GDPR-K in the EU):

- **COPPA** (Children's Online Privacy Protection Act) - governs online collection of personal information from children under 13.
- **FERPA** (Family Educational Rights and Privacy Act) - governs "education records" held by schools.

## How the current design already helps

- **No open student communication.** Students can message *teachers only*; there is no student-to-student messaging and no public/social feed. This narrows exposure dramatically.
- **Human review before delivery.** Every student-authored message is screened and held in a teacher moderation queue; nothing is delivered until a teacher approves it.
- **Server-side access control.** Data is gated by role on the server (`requireRole`), not just hidden in the UI.
- **Data minimization at login.** Users must be provisioned by an admin with a role; the app never auto-creates accounts or self-assigns roles from a raw Google login.
- **Encryption.** TLS/HTTPS in transit (via the host) and AES-256-GCM encryption of message bodies at rest when `FIELD_ENCRYPTION_KEY` is set. Signature acknowledgments store a hashed (not raw) IP for the audit trail.
- **Parental linkage.** Parents are linked to their own children only, supporting parental-review requirements.

## What a real deployment would still need to add

1. **School-as-agent / consent model.** Under COPPA, schools can consent on behalf of parents for educational use, but this must be documented, and parents must be informed. Provide a written privacy notice and a Data Processing Agreement.
2. **Verifiable parental consent flow** for any use beyond the school's educational scope.
3. **Records access & correction (FERPA).** Tools for parents to request, review, and correct their child's records, and an audit log of who accessed what.
4. **Data retention & deletion policy.** Automatic purging of messages/records after a defined period, plus a "delete this student" workflow that cascades.
5. **Key management.** Store `FIELD_ENCRYPTION_KEY` and the Firebase service account in a secrets manager (not a file), with rotation. Consider per-field envelope encryption via a KMS.
6. **Vendor & subprocessor review.** MongoDB Atlas, Firebase/Google, Render, and Vercel each become subprocessors; confirm each offers a signed DPA and student-data terms.
7. **Stronger moderation.** The built-in filter is a keyword/pattern baseline. Production should add a hosted toxicity/PII classifier and image scanning if attachments are ever allowed in student messages.
8. **Access logging & breach response.** Comprehensive audit logging, alerting, and an incident-response plan.
9. **Accessibility & language.** WCAG 2.1 AA conformance review and multi-language support for families.
10. **Penetration test & security review** before handling real student data.
