import mongoose from 'mongoose';

const { Schema } = mongoose;

export const QUESTION_TYPES = ['single_choice', 'multiple_choice', 'rating', 'short_text', 'long_text', 'yes_no'];

const questionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    options: [{ type: String }], // for choice types
    required: { type: Boolean, default: false },
    scaleMax: { type: Number, default: 5 }, // for rating
  },
  { _id: true }
);

const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    value: { type: Schema.Types.Mixed }, // string | string[] | number
  },
  { _id: false }
);

const responseSchema = new Schema(
  {
    // Null respondent = anonymous submission.
    respondent: { type: Schema.Types.ObjectId, ref: 'User' },
    answers: { type: [answerSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const surveySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    audienceRoles: [{ type: String, enum: ['student', 'parent', 'teacher', 'admin'] }],
    anonymous: { type: Boolean, default: false },

    // Scheduling / cadence
    cadence: { type: String, enum: ['one_time', 'weekly', 'monthly', 'post_lesson', 'end_of_class'], default: 'one_time' },
    opensAt: { type: Date, default: Date.now },
    closesAt: { type: Date },
    status: { type: String, enum: ['draft', 'open', 'closed'], default: 'draft', index: true },

    questions: { type: [questionSchema], default: [] },
    responses: { type: [responseSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Survey', surveySchema);
