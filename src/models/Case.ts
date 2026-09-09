import mongoose, { Schema, Document, Model } from 'mongoose';

const subTransform = {
  transform(doc: any, ret: Record<string, any>) {
    ret.id = ret._id ? ret._id.toString() : ret._id;
    delete ret._id;
    return ret;
  },
};

export interface IPerson {
  id?: string;
  name: string;
  relationship: 'Victim' | 'Witness' | 'Suspect' | 'Reporting Person' | 'Other';
  contact?: string;
  address?: string;
  notes?: string;
}

const personSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      enum: ['Victim', 'Witness', 'Suspect', 'Reporting Person', 'Other'],
      required: true,
    },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: true, toJSON: subTransform }
);

export interface ICaseDocument {
  id?: string;
  _id?: any;
  name: string;
  type?: string;
  size?: string;
  dataUrl?: string;
  category?: string;
  sha256?: string;
  ocrText?: string;
  normalizedOcrText?: string;
  ocrConfidence?: number;
  ocrQuality?: 'High' | 'Medium' | 'Low';
  pageCount?: number;
  ocrStatus?: 'not_started' | 'processing' | 'completed' | 'failed';
  ocrError?: string;
  ocrProcessedAt?: Date;
}

const documentSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, default: 'FILE' },
    size: { type: String, default: '' },
    dataUrl: { type: String, default: '' },
    category: { type: String, default: 'FIR Copy' },
    sha256: { type: String, default: '' },
    ocrText: { type: String, default: '' },
    normalizedOcrText: { type: String, default: '' },
    ocrConfidence: { type: Number },
    ocrQuality: { type: String, enum: ['High', 'Medium', 'Low'] },
    pageCount: { type: Number, default: 1 },
    ocrStatus: {
      type: String,
      enum: ['not_started', 'processing', 'completed', 'failed'],
      default: 'not_started',
    },
    ocrError: { type: String, default: '' },
    ocrProcessedAt: { type: Date },
  },
  { _id: true, toJSON: subTransform }
);

export const CATEGORIES = ['Theft', 'Assault', 'Fraud', 'Property Dispute', 'Cyber Crime', 'Other', ''] as const;
export const STATUSES = ['Active', 'Pending', 'Closed'] as const;

export interface ICase extends Document {
  _id: mongoose.Types.ObjectId;
  caseId: string;
  title: string;
  incidentDate?: string;
  time?: string;
  location?: string;
  category?: string;
  description?: string;
  status: 'Active' | 'Pending' | 'Closed';
  date?: string;
  people: IPerson[];
  documents: ICaseDocument[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const caseSchema = new Schema<ICase>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: [true, 'Incident title is required'], trim: true },
    incidentDate: { type: String, default: '' },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, enum: CATEGORIES, default: '' },
    description: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    date: { type: String, default: '' },
    people: { type: [personSchema], default: [] },
    documents: { type: [documentSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

caseSchema.set('toJSON', {
  transform(doc, ret: Record<string, any>) {
    ret.id = ret.caseId;
    delete ret._id;
    delete ret.__v;
    delete ret.caseId;
    return ret;
  },
});

export const Case: Model<ICase> = mongoose.models.Case || mongoose.model<ICase>('Case', caseSchema);
export default Case;
