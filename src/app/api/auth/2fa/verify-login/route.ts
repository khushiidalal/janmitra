import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import TwoFactorToken from '@/models/TwoFactorToken';

import { signToken } from '@/lib/server/auth';
import {
  extractClientIp,
  parseUserAgent,
  recordLoginSecurityEvent,
} from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification token is required',
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const verification = await TwoFactorToken.findOne({
      tokenHash,
      purpose: 'login-2fa',
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification link is invalid or expired.',
        },
        { status: 400 }
      );
    }

    const user = await User.findById(verification.userId);

    if (!user) {
      await verification.deleteOne();

      return NextResponse.json(
        {
          success: false,
          error: 'User not found.',
        },
        { status: 404 }
      );
    }

    const sessionId = crypto.randomUUID();

    const ipAddress = extractClientIp(req);

    const userAgent =
      req.headers.get('user-agent') || '';

    const {
      browser,
      operatingSystem,
      deviceType,
    } = parseUserAgent(userAgent);

    const device =
      `${operatingSystem} ${deviceType} · ${browser}`;

    const newSession = {
      sessionId,
      device,
      browser,
      operatingSystem,
      deviceType,
      ipAddress,
      location:
        ipAddress === '127.0.0.1'
          ? 'Local / Secure Intranet'
          : 'Verified Location',
      isTrusted: true,
      createdAt: new Date(),
      lastActive: new Date(),
    };

    if (!Array.isArray(user.sessions)) {
      user.sessions = [];
    }

    user.sessions.unshift(newSession as any);

    if (user.sessions.length > 15) {
      user.sessions =
        user.sessions.slice(0, 15);
    }

    user.twoFactorLastVerified = new Date();

    await user.save();

    const jwt = signToken(user, sessionId);

    await TwoFactorToken.deleteMany({
      userId: user._id,
      purpose: 'login-2fa',
    });

    await recordLoginSecurityEvent({
      req,
      user,
      attemptedEmail: user.email,
      status: 'success',
    });

    const userJson: any = user.toJSON();
    userJson.currentSessionId = sessionId;
    if (!userJson.username) {
      userJson.username = (user as any).username || (user.email ? user.email.split('@')[0] : '');
    }

    return NextResponse.json({
      success: true,
      token: jwt,
      user: userJson,
      message: 'Two-factor verification successful.',
    });
  } catch (error: any) {
    console.error('2FA LOGIN VERIFY ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Unable to verify login.',
      },
      { status: 500 }
    );
  }
}