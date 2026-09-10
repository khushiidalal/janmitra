import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITwoFactorToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  purpose: "enable-2fa" | "login-2fa";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const twoFactorTokenSchema = new Schema<ITwoFactorToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["enable-2fa", "login-2fa"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

const TwoFactorToken: Model<ITwoFactorToken> =
  mongoose.models.TwoFactorToken ||
  mongoose.model<ITwoFactorToken>(
    "TwoFactorToken",
    twoFactorTokenSchema
  );

export default TwoFactorToken;