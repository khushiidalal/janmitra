import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAudit extends Document {
  _id: mongoose.Types.ObjectId;
  time: Date;
  type: 'document' | 'review' | 'login' | 'approval' | 'registration';
  text: string;
  accessedBy: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  status?: 'success' | 'failed';
  isUnusual?: boolean;
  unusualReason?: string;
  severity?: 'info' | 'warning' | 'critical';
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userEmail: {
      type: String,
      trim: true,
      required: false,
    },
    userRole: {
      type: String,
      trim: true,
      required: false,
    },
    ipAddress: {
      type: String,
      trim: true,
      required: false,
    },
    userAgent: {
      type: String,
      trim: true,
      required: false,
    },
    browser: {
      type: String,
      trim: true,
      required: false,
    },
    operatingSystem: {
      type: String,
      trim: true,
      required: false,
    },
    deviceType: {
      type: String,
      trim: true,
      required: false,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
      required: false,
    },
    isUnusual: {
      type: Boolean,
      default: false,
      required: false,
    },
    unusualReason: {
      type: String,
      trim: true,
      required: false,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      required: false,
    },
  },
  { timestamps: true }
);

auditSchema.index({ type: 1, time: -1 });
auditSchema.index({ userId: 1, type: 1, time: -1 });
auditSchema.index({ ipAddress: 1, time: -1 });

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
