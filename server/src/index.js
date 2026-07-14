import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env.js';
import { connectDB } from './config/db.js';
import { initFirebase } from './config/firebase.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
// Register all models with Mongoose on boot.
import './models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The vanilla frontend lives at <repo>/web and is served by this same server.
const WEB_DIR = path.join(__dirname, '..', '..', 'web');

async function bootstrap() {
  initFirebase();
  await connectDB();

  const app = express();
  app.set('trust proxy', 1);

  // Sensible security headers. CSP is disabled because the frontend loads the
  // Firebase SDK from gstatic and fonts from Google; lock this down per-source
  // before a real production launch.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Basic rate limiting to blunt abuse (API only).
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, demoMode: env.demoMode, time: new Date().toISOString() }));
  app.use('/api', routes);

  // 404 for unknown API routes (before static so /api never falls through to HTML).
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // ---- Serve the static frontend (same origin as the API) ----
  app.use(express.static(WEB_DIR, { index: 'index.html', extensions: ['html'] }));
  // SPA fallback: any non-API GET returns the app shell so the hash router works.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(WEB_DIR, 'index.html'));
  });

  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] Saphron Sua running on http://localhost:${env.port} (demoMode=${env.demoMode})`);
    console.log(`[server] Frontend served from ${WEB_DIR}`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
