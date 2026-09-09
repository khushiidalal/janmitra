import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export const DOCUMENT_TYPES = [
  'FIR',
  'Investigation Report',
  'Witness Statement',
  'Evidence',
  'Court Order',
  'Final Report',
  'Other',
] as const;

export const STORAGE_PROVIDERS = ['local', 'S3', 'GCS'] as const;

export interface IDocument extends MongooseDoc {
  _id: mongoose.Types.ObjectId;
  caseId: string;
  caseObjectId?: mongoose.Types.ObjectId;
  name: string;
  documentType: typeof DOCUMENT_TYPES[number];
  description?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: typeof STORAGE_PROVIDERS[number];
  storageKey?: string;
  filePath?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    caseId: {
      type: String,
      required: [true, 'caseId is required'],
      trim: true,
      index: true,
    },
    caseObjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: {
        values: DOCUMENT_TYPES,
        message: `documentType must be one of: ${DOCUMENT_TYPES.join(', ')}`,
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      required: [true, 'fileName is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'mimeType is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'fileSize is required'],
      min: [1, 'fileSize must be greater than 0'],
    },
    storageProvider: {
      type: String,
      enum: STORAGE_PROVIDERS,
      default: 'local',
    },
    storageKey: {
      type: String,
      default: '',
    },
    filePath: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

documentSchema.set('toJSON', {
  transform(doc, ret: Record<string, any>) {
    ret.id = ret._id ? ret._id.toString() : ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const DocumentModel: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>('Document', documentSchema);
export default DocumentModel;
