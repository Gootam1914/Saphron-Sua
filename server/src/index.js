import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env.js';
import { connectDB } from './config/db.js';
import { initFirebase } from './config/firebase.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
// Register all models with Mongoose on boot.
import './models/index.js';

async function bootstrap() {
  initFirebase();
  await connectDB();

  const app = express();
  app.set('trust proxy', 1);

  // Security: sets sensible HTTP headers. HTTPS itself is terminated by the
  // host (Render/Vercel) - see README for the encryption-in-transit note.
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Basic rate limiting to blunt abuse.
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, demoMode: env.demoMode, time: new Date().toISOString() }));
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] Saphron Sua API listening on http://localhost:${env.port} (demoMode=${env.demoMode})`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
