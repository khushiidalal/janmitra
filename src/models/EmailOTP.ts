import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailOTP extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailOTPSchema = new Schema<IEmailOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

emailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailOTP: Model<IEmailOTP> = mongoose.models.EmailOTP || mongoose.model<IEmailOTP>('EmailOTP', emailOTPSchema);
export default EmailOTP;
