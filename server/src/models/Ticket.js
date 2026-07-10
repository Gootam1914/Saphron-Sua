import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TICKET_CATEGORIES = ['it', 'facilities', 'general'];
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved'];
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const historySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // "created", "status:open->in_progress", "assigned", "comment"
    note: { type: String, default: '' },
  },
  { _id: false }
);

const ticketSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: TICKET_CATEGORIES, required: true, index: true },
    status: { type: String, enum: TICKET_STATUSES, default: 'open', index: true },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'medium', index: true },

    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    history: { type: [historySchema], default: [] },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);
