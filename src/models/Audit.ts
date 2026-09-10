import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAudit extends Document {
  _id: mongoose.Types.ObjectId;
  time: Date;
  type: 'document' | 'review' | 'login' | 'approval' | 'registration' | 'security' | 'admin' | 'setting';
  text: string;
  accessedBy: string;
  action?: string;
  target?: string;
  targetId?: string;
  targetType?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  userId?: mongoose.Types.ObjectId;
  caseId?: string;
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
      enum: ['document', 'review', 'login', 'approval', 'registration', 'security', 'admin', 'setting'],
      required: true,
    },
    action: {
      type: String,
      trim: true,
      index: true,
      required: false,
    },
    target: {
      type: String,
      trim: true,
      required: false,
    },
    targetId: {
      type: String,
      trim: true,
      required: false,
    },
    targetType: {
      type: String,
      trim: true,
      required: false,
    },
    changes: {
      before: { type: Schema.Types.Mixed, default: undefined },
      after: { type: Schema.Types.Mixed, default: undefined },
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
    caseId: {
      type: String,
      trim: true,
      index: true,
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
auditSchema.index({ action: 1, time: -1 });
auditSchema.index({ caseId: 1, time: -1 });
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

if (mongoose.models && mongoose.models.Audit) {
  delete (mongoose.models as any).Audit;
}

export const Audit: Model<IAudit> = mongoose.models.Audit || mongoose.model<IAudit>('Audit', auditSchema);
export default Audit;
