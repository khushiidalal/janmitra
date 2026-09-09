import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDraft extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  description?: string;
  people?: any[];
  documents?: any[];
  evidence?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const draftSchema = new Schema<IDraft>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    title: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    people: { type: Array, default: [] },
    documents: { type: Array, default: [] },
    evidence: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

draftSchema.set('toJSON', {
  transform(doc, ret: Record<string, any>) {
    delete ret._id;
    delete ret.__v;
    delete ret.user;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

export const Draft: Model<IDraft> = mongoose.models.Draft || mongoose.model<IDraft>('Draft', draftSchema);
export default Draft;
