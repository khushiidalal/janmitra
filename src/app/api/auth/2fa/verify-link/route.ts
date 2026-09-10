import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import TwoFactorToken from "@/models/TwoFactorToken";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token =
      req.nextUrl.searchParams.get("token");

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const requestOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;
    const appUrl = (process.env.APP_URL || requestOrigin || "http://localhost:5000").replace(/\/$/, "");

    if (!token) {
      return NextResponse.redirect(
        `${appUrl}/2fa-result?status=invalid`
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const verification =
      await TwoFactorToken.findOne({
        tokenHash,
        purpose: "enable-2fa",
        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!verification) {
      return NextResponse.redirect(
        `${appUrl}/2fa-result?status=expired`
      );
    }

    const user = await User.findById(
      verification.userId
    );

    if (!user) {
      await verification.deleteOne();

      return NextResponse.redirect(
        `${appUrl}/2fa-result?status=invalid`
      );
    }

    // NOW 2FA is actually enabled.
    user.twoFactorEnabled = true;
    user.twoFactorMethod = "email-link";
    user.twoFactorLastVerified = new Date();

    await user.save();

    // One-time link.
    await TwoFactorToken.deleteMany({
      userId: user._id,
      purpose: "enable-2fa",
    });

    return NextResponse.redirect(
      `${appUrl}/2fa-result?status=success`
    );
  } catch (error) {
    console.error(
      "2FA VERIFY LINK ERROR:",
      error
    );

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const requestOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;
    const appUrl = (process.env.APP_URL || requestOrigin || "http://localhost:5000").replace(/\/$/, "");

    return NextResponse.redirect(
      `${appUrl}/2fa-result?status=error`
    );
  }
}