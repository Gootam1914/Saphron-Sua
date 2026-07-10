import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ROLES = ['student', 'parent', 'teacher', 'admin'];

const notificationPrefsSchema = new Schema(
  {
    messages: { type: Boolean, default: true },
    tickets: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    surveys: { type: Boolean, default: true },
    rewards: { type: Boolean, default: true },
    channel: { type: String, enum: ['in_app', 'email', 'both'], default: 'in_app' },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    // Firebase UID (or a demo id in demo mode). Primary external identity.
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true },
    photoURL: { type: String, default: '' },
    role: { type: String, enum: ROLES, required: true, index: true },

    // Org scoping - supports multi-school deployments later.
    school: { type: Schema.Types.ObjectId, ref: 'School' },

    // Student-specific
    gradeLevel: { type: String }, // e.g. "K", "1"..."5"
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom' },

    // Relationships
    // Parents -> their children (students); Students -> their parents/guardians.
    children: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    guardians: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // Teacher -> classrooms they own (denormalized convenience)
    teachesClassrooms: [{ type: Schema.Types.ObjectId, ref: 'Classroom' }],

    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) },

    // Parental controls flag: parent has enabled review of this child's messages.
    parentalMonitoringEnabled: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject({ versionKey: false });
  delete obj.firebaseUid;
  return obj;
};

export default mongoose.model('User', userSchema);
