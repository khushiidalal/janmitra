import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSetting extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  systemName: string;
  stationName: string;
  maintenanceMode: boolean;
  announcement: string;
  twoFactorPolicy: 'optional' | 'officers_required' | 'all_required';
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  allowSelfRegistration: boolean;
  ocrAutoProcess: boolean;
  defaultCaseCategory: string;
  updatedBy?: string;
  updatedByEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      trim: true,
    },
    systemName: {
      type: String,
      default: 'JANMITRA - Legal Investigation System',
      trim: true,
    },
    stationName: {
      type: String,
      default: 'Central Cyber & Forensic Jurisdiction HQ',
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    announcement: {
      type: String,
      default: '',
      trim: true,
    },
    twoFactorPolicy: {
      type: String,
      enum: ['optional', 'officers_required', 'all_required'],
      default: 'optional',
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 1440,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    allowSelfRegistration: {
      type: Boolean,
      default: true,
    },
    ocrAutoProcess: {
      type: Boolean,
      default: true,
    },
    defaultCaseCategory: {
      type: String,
      default: 'Theft',
      trim: true,
    },
    updatedBy: {
      type: String,
      default: 'System Default',
      trim: true,
    },
    updatedByEmail: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

systemSettingSchema.set('toJSON', {
  transform(doc, ret: Record<string, any>) {
    ret.id = ret._id ? ret._id.toString() : ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const SystemSetting: Model<ISystemSetting> =
  mongoose.models.SystemSetting ||
  mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);

export default SystemSetting;
