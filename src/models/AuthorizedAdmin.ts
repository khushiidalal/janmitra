import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthorizedAdmin extends Document {
  email: string;
  active: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const authorizedAdminSchema = new Schema<IAuthorizedAdmin>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
    verifiedAt: { type: Date, required: true },
    verifiedBy: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const AuthorizedAdmin: Model<IAuthorizedAdmin> =
  mongoose.models.AuthorizedAdmin ||
  mongoose.model<IAuthorizedAdmin>('AuthorizedAdmin', authorizedAdminSchema);

export default AuthorizedAdmin;