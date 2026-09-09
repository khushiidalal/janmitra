import { NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request: Request) {
  try {
    // MongoDB connect
    await connectDB();

    // Frontend se token aur new password milega
    const { token, newPassword } = await request.json();

    // Validation
    if (!token || !newPassword) {
      return NextResponse.json(
        {
          message: "Token and new password are required.",
        },
        { status: 400 }
      );
    }

    // Minimum password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // Email wale token ka hash banao
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Check karo token valid hai aur expire nahi hua
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        {
          message: "Reset link is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    // Token se associated user find karo
    const user = await User.findOne({
      email: resetRecord.email,
    });

    if (!user) {
      await PasswordResetToken.deleteOne({
        _id: resetRecord._id,
      });

      return NextResponse.json(
        {
          message: "Unable to reset password.",
        },
        { status: 400 }
      );
    }

    // New password set karo
    // User.ts ka pre-save hook automatically bcrypt hash karega
    user.password = newPassword;

    await user.save();

    // Token ko delete kar do, taaki dobara use na ho
    await PasswordResetToken.deleteOne({
      _id: resetRecord._id,
    });

    return NextResponse.json(
      {
        message: "Password reset successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        message: "Unable to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}