import mongoose from 'mongoose';

const { Schema } = mongoose;

const classroomSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // "Room 3B"
    gradeLevel: { type: String, required: true }, // "K".."5"
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    school: { type: Schema.Types.ObjectId, ref: 'School' },
  },
  { timestamps: true }
);

export default mongoose.model('Classroom', classroomSchema);
