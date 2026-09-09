import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAudit extends Document {
  _id: mongoose.Types.ObjectId;
  time: Date;
  type: 'document' | 'review' | 'login' | 'approval' | 'registration';
  text: string;
  accessedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditSchema = new Schema<IAudit>(
  {
    time: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['document', 'review', 'login', 'approval', 'registration'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    accessedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

auditSchema.set('toJSON', {
  transform(doc, ret: Record<string, any>) {
    ret.id = ret._id ? ret._id.toString() : ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Audit: Model<IAudit> = mongoose.models.Audit || mongoose.model<IAudit>('Audit', auditSchema);
export default Audit;
