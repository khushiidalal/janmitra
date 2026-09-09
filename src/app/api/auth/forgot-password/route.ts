import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

import connectDB from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request: Request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check whether user exists
    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Don't reveal whether email is registered
    if (!user) {
      return NextResponse.json({
        message:
          "If this email is registered, a password reset link has been sent.",
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store hash instead of actual token
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Link expires after 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
      {
        upsert: true,
        new: true,
      }
    );

    const appUrl =
      process.env.APP_URL || "http://localhost:3000";

    const resetLink =
      `${appUrl}/reset-password?token=${resetToken}`;

    // Gmail / SMTP connection
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"JANMITRA" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: "Reset your JANMITRA password",

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>JANMITRA Password Reset</h2>

          <p>
            We received a request to reset your JANMITRA account password.
          </p>

          <p>Click the button below to create a new password.</p>

          <a
            href="${resetLink}"
            style="
              display:inline-block;
              background:#2563eb;
              color:#ffffff;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px;
              font-weight:bold;
              margin:10px 0;
            "
          >
            Reset Password
          </a>

          <p>This link will expire in 15 minutes.</p>

          <p>
            If you did not request this password reset,
            you can ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message:
        "If this email is registered, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        message: "Unable to send password reset email.",
      },
      { status: 500 }
    );
  }
}