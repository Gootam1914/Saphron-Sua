import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

// 15 MB cap; block executables by extension.
export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const banned = ['.exe', '.sh', '.bat', '.js', '.cmd'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (banned.includes(ext)) return cb(new Error('File type not allowed.'));
    cb(null, true);
  },
});
