import mongoose from 'mongoose';

const { Schema } = mongoose;

export const DOC_TYPES = ['permission_slip', 'newsletter', 'tardy_slip', 'policy', 'form', 'other'];

const acknowledgementSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // For permission slips: the child the acknowledgement is on behalf of.
    onBehalfOf: { type: Schema.Types.ObjectId, ref: 'User' },
    signedName: { type: String, required: true }, // typed signature
    signedAt: { type: Date, default: Date.now },
    ipHash: { type: String, default: '' }, // hashed, for audit trail
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    docType: { type: String, enum: DOC_TYPES, default: 'other', index: true },

    // Storage: local disk path in dev, or a cloud URL in prod.
    fileName: { type: String, required: true },
    storageKey: { type: String, required: true }, // relative path or object key
    mimeType: { type: String, default: 'application/octet-stream' },
    sizeBytes: { type: Number, default: 0 },

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom' },

    // Role-based access control. Empty = all authenticated roles.
    visibleToRoles: [{ type: String, enum: ['student', 'parent', 'teacher', 'admin'] }],

    // Acknowledgement / digital signature (e.g. permission slips)
    requiresAcknowledgement: { type: Boolean, default: false },
    acknowledgements: { type: [acknowledgementSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
