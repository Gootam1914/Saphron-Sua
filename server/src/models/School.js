import mongoose from 'mongoose';

const { Schema } = mongoose;

const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    emailDomain: { type: String, lowercase: true, trim: true }, // e.g. "yourschool.org"
    timezone: { type: String, default: 'America/New_York' },
  },
  { timestamps: true }
);

export default mongoose.model('School', schoolSchema);
