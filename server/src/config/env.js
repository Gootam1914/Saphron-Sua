import dotenv from 'dotenv';
dotenv.config();

const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saphron_sua',
  demoMode: bool(process.env.DEMO_MODE, true),
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || '',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
};

export const isProd = env.nodeEnv === 'production';
