import mongoose from 'mongoose';

const { Schema } = mongoose;

export const RSVP_STATUSES = ['going', 'maybe', 'not_going'];

const rsvpSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: RSVP_STATUSES, required: true },
    guests: { type: Number, default: 0, min: 0 },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, enum: ['pta', 'field_trip', 'classroom', 'school_wide', 'holiday', 'other'], default: 'other', index: true },

    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    allDay: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom' }, // null = school-wide

    // Who can see/RSVP. Empty audience = everyone.
    audienceRoles: [{ type: String, enum: ['student', 'parent', 'teacher', 'admin'] }],

    rsvpEnabled: { type: Boolean, default: true },
    rsvps: { type: [rsvpSchema], default: [] },

    // Reminder scheduling (minutes before start).
    reminderMinutesBefore: { type: Number, default: 1440 },
    remindersSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
