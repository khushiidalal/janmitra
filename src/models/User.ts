import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserSession {
  sessionId: string;
  device: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  ipAddress: string;
  location?: string;
  isTrusted?: boolean;
  createdAt: Date;
  lastActive: Date;
}

export interface IUserPreferences {
  language: string;
  textSize: 'Small' | 'Medium' | 'Large';
  highContrast: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  role: 'Admin' | 'Senior Officer' | 'Investigator' | 'Officer' | 'Clerk' | 'Viewer';
  dateOfBirth?: string;
  gender?: string;
  govIdType?: string;
  govIdNumber?: string;
  address?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  jurisdiction?: string;
  joiningDate?: string;
  supervisingOfficer?: string;
  officialEmail?: string;
  officialPhone?: string;
  profilePhoto?: string;
  email: string;
  password?: string;
  preferences?: IUserPreferences;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  twoFactorLastVerified?: Date | null;
  sessions?: IUserSession[];
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Senior Officer', 'Investigator', 'Officer', 'Clerk', 'Viewer'],
      default: 'Viewer',
      required: true,
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    govIdType: {
      type: String,
      trim: true,
      default: '',
    },
    govIdNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },
    jurisdiction: {
      type: String,
      trim: true,
      default: '',
    },
    joiningDate: {
      type: String,
      trim: true,
      default: '',
    },
    supervisingOfficer: {
      type: String,
      trim: true,
      default: '',
    },
    officialEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    officialPhone: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    preferences: {
      language: { type: String, default: 'English (US)' },
      textSize: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
      highContrast: { type: Boolean, default: false },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      default: 'sms',
    },
    twoFactorLastVerified: {
      type: Date,
      default: null,
    },
    sessions: [
      {
        sessionId: { type: String, required: true },
        device: { type: String, default: 'Unknown Device' },
        browser: { type: String, default: 'Unknown' },
        operatingSystem: { type: String, default: 'Unknown' },
        deviceType: { type: String, default: 'Desktop' },
        ipAddress: { type: String, default: '127.0.0.1' },
        location: { type: String, default: 'Secure Network' },
        isTrusted: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(doc, ret: Record<string, any>) {
    ret.id = ret._id ? ret._id.toString() : ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
