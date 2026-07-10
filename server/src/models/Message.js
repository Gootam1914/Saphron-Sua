import mongoose from 'mongoose';

const { Schema } = mongoose;

// A Conversation groups messages between participants (DM or class broadcast).
const conversationSchema = new Schema(
  {
    // 'dm' = one-to-one thread; 'broadcast' = teacher -> class announcement.
    type: { type: String, enum: ['dm', 'broadcast'], default: 'dm', index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    // For broadcast threads, the classroom being addressed.
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom' },
    subject: { type: String, trim: true, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: '' },
    // Denormalized unread counts keyed by userId string.
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

// Moderation state for messages sent BY students (teacher review queue).
const MODERATION_STATUS = ['not_required', 'pending', 'approved', 'rejected', 'flagged'];

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Body may be stored encrypted at rest (see utils/crypto). `encrypted` marks that.
    body: { type: String, required: true },
    encrypted: { type: Boolean, default: false },

    // Moderation pipeline
    moderationStatus: { type: String, enum: MODERATION_STATUS, default: 'not_required', index: true },
    // Which teacher may review (the student's teacher).
    moderator: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    // Words/patterns the auto-filter tripped on.
    flaggedTerms: [{ type: String }],
    moderatorNote: { type: String, default: '' },

    // Delivery visibility. A student message only becomes visible to the teacher
    // once approved; a rejected message never reaches the recipient.
    visibleToRecipient: { type: Boolean, default: true },

    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export const MODERATION_STATUSES = MODERATION_STATUS;
export default mongoose.model('Message', messageSchema);
