import mongoose from 'mongoose';

const { Schema } = mongoose;

export const NOTIFICATION_TYPES = ['message', 'ticket', 'event', 'announcement', 'survey', 'reward', 'moderation', 'document'];

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    // Deep link target within the app, e.g. "/messages/:conversationId"
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    // Optional reference back to the source document.
    refModel: { type: String },
    refId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
