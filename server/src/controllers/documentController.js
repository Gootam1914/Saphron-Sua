import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { asyncHandler, httpError } from '../utils/asyncHandler.js';
import Document from '../models/Document.js';
import { hashValue } from '../utils/crypto.js';
import { notify } from '../utils/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// GET /api/documents - role-filtered listing.
export const listDocuments = asyncHandler(async (req, res) => {
  const me = req.user;
  const { docType } = req.query;
  const filter = { $or: [{ visibleToRoles: { $size: 0 } }, { visibleToRoles: me.role }] };
  if (docType) filter.docType = docType;
  const docs = await Document.find(filter)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'displayName role')
    .lean();
  const shaped = docs.map((d) => ({
    ...d,
    acknowledgedByMe: (d.acknowledgements || []).some((a) => String(a.user) === String(me._id)),
    acknowledgementCount: (d.acknowledgements || []).length,
  }));
  res.json({ documents: shaped });
});

// POST /api/documents - upload (teacher/admin). Uses multer (req.file).
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'A file is required.');
  const { title, description = '', docType = 'other', visibleToRoles, requiresAcknowledgement, classroom } = req.body;
  const doc = await Document.create({
    title: title || req.file.originalname,
    description,
    docType,
    fileName: req.file.originalname,
    storageKey: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    uploadedBy: req.user._id,
    classroom: classroom || undefined,
    visibleToRoles: parseRoles(visibleToRoles),
    requiresAcknowledgement: requiresAcknowledgement === 'true' || requiresAcknowledgement === true,
  });
  res.status(201).json({ document: doc });
});

function parseRoles(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return String(v).split(',').map((s) => s.trim()).filter(Boolean); }
}

// GET /api/documents/:id/download - stream file if the role may access it.
export const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw httpError(404, 'Document not found.');
  const roles = doc.visibleToRoles || [];
  if (roles.length && !roles.includes(req.user.role)) throw httpError(403, 'Not permitted to access this document.');
  const filePath = path.join(UPLOAD_DIR, doc.storageKey);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing on server (demo documents have no backing file).' });
  }
  res.download(filePath, doc.fileName);
});

// POST /api/documents/:id/acknowledge - parent digital signature.
export const acknowledgeDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw httpError(404, 'Document not found.');
  if (!doc.requiresAcknowledgement) throw httpError(400, 'This document does not require acknowledgement.');
  const { signedName, onBehalfOf } = req.body;
  if (!signedName) throw httpError(400, 'signedName (typed signature) is required.');

  const already = doc.acknowledgements.find(
    (a) => String(a.user) === String(req.user._id) && String(a.onBehalfOf || '') === String(onBehalfOf || '')
  );
  if (already) throw httpError(409, 'Already acknowledged.');

  doc.acknowledgements.push({
    user: req.user._id,
    onBehalfOf: onBehalfOf || undefined,
    signedName,
    signedAt: new Date(),
    ipHash: hashValue(req.ip || ''),
  });
  await doc.save();

  await notify(doc.uploadedBy, {
    type: 'document',
    title: `Acknowledged: ${doc.title}`,
    body: `${req.user.displayName} signed "${doc.title}".`,
    link: '/documents',
    refModel: 'Document',
    refId: doc._id,
  });
  res.json({ ok: true, acknowledgementCount: doc.acknowledgements.length });
});
