import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('[db] connected to MongoDB');
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
