import mongoose from 'mongoose';

const { Schema } = mongoose;

// Catalog of badge types a school can award.
const badgeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // "kindness"
    label: { type: String, required: true }, // "Kindness Star"
    description: { type: String, default: '' },
    icon: { type: String, default: 'star' }, // lucide icon name
    color: { type: String, default: 'sun' }, // token color
    points: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// An award granted to a student.
const rewardSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    awardedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: '' },
    points: { type: Number, default: 10 },
    awardedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const Badge = mongoose.model('Badge', badgeSchema);
export default mongoose.model('Reward', rewardSchema);
