import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import TwoFactorToken from "@/models/TwoFactorToken";

import { getAuthenticatedUser } from "@/lib/server/auth";
import { getMailer } from "@/lib/server/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const user = await User.findById(authUser._id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: "Two-factor authentication is already enabled.",
        },
        { status: 400 }
      );
    }

    // Use the authenticated user's registered account email specifically
    const verificationEmail = user.email?.trim().toLowerCase();

    if (!verificationEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "No registered account email found for this user.",
        },
        { status: 400 }
      );
    }

    // Random token sent to the user's email.
    const token = crypto.randomBytes(32).toString("hex");

    // Only its hash is stored in MongoDB.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Invalidate previous enable-2FA links.
    await TwoFactorToken.deleteMany({
      userId: user._id,
      purpose: "enable-2fa",
    });

    // Link valid for 10 minutes.
    await TwoFactorToken.create({
      userId: user._id,
      tokenHash,
      purpose: "enable-2fa",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const requestOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;
    const appUrl = (process.env.APP_URL || requestOrigin || "http://localhost:5000").replace(/\/$/, "");

    const verificationLink =
      `${appUrl}/api/auth/2fa/verify-link?token=${encodeURIComponent(token)}`;

    const transporter = getMailer();
    console.log("2FA recipient:", verificationEmail);

    const info = await transporter.sendMail({
      from: `"JANMITRA Security" <${process.env.SMTP_USER}>`,
      to: verificationEmail,

      subject: "Verify Two-Factor Authentication - JANMITRA",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            color: #1e293b;
          "
        >
          <h2>JANMITRA Security Verification</h2>

          <p>Hello ${user.fullName},</p>

          <p>
            A request was made to enable Two-Factor
            Authentication on your JANMITRA account.
          </p>

          <p>
            Click the button below to verify your email
            and enable 2FA.
          </p>

          <a
            href="${verificationLink}"
            style="
              display: inline-block;
              background: #2563eb;
              color: #ffffff;
              padding: 12px 20px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 12px 0;
            "
          >
            Verify & Enable 2FA
          </a>

          <p>
            This verification link expires in
            <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request this change,
            you can safely ignore this email.
          </p>

          <hr
            style="
              border: 0;
              border-top: 1px solid #e2e8f0;
              margin: 24px 0;
            "
          />

          <p style="font-size: 12px; color: #64748b;">
            JANMITRA Security
          </p>
        </div>
      `,
    });

    console.log("MAIL ACCEPTED:", info.accepted);
    console.log("MAIL REJECTED:", info.rejected);
    console.log("MAIL RESPONSE:", info.response);

    const isAccepted = Array.isArray(info.accepted) && info.accepted.length > 0;
    if (!isAccepted) {
      console.error("2FA email delivery was not accepted by the SMTP server:", info.response);
      return NextResponse.json(
        {
          success: false,
          error: "Verification email was not accepted for delivery by the mail server.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "A 2FA verification link has been sent to your registered email.",
    });
  } catch (error: any) {
    console.error("2FA SEND LINK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Unable to send 2FA verification email.",
      },
      { status: 500 }
    );
  }
}