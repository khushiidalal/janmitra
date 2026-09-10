import { NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request: Request) {
  try {
    
    await connectDB();

    
    const { token, newPassword } = await request.json();

    
    if (!token || !newPassword) {
      return NextResponse.json(
        {
          message: "Token and new password are required.",
        },
        { status: 400 }
      );
    }

    
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    
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

    
    
    user.password = newPassword;

    await user.save();

    
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