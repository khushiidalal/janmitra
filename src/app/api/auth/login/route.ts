import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/server/auth';
import { recordLoginSecurityEvent, extractClientIp, parseUserAgent } from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Record failed authentication security event
      await recordLoginSecurityEvent({
        req,
        user: user || null,
        attemptedEmail: normalizedEmail,
        status: 'failed',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create real device session
    const sessionId = crypto.randomUUID();
    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);
    const device = `${operatingSystem} ${deviceType} · ${browser}`;

    const newSession = {
      sessionId,
      device,
      browser,
      operatingSystem,
      deviceType,
      ipAddress,
      location: ipAddress === '127.0.0.1' ? 'Local / Secure Intranet' : 'Verified Location',
      isTrusted: true,
      createdAt: new Date(),
      lastActive: new Date(),
    };

    if (!Array.isArray(user.sessions)) {
      user.sessions = [];
    }
    user.sessions.unshift(newSession as any);
    if (user.sessions.length > 15) {
      user.sessions = user.sessions.slice(0, 15);
    }
    await user.save();

    const token = signToken(user, sessionId);

    // Record successful login security event
    await recordLoginSecurityEvent({
      req,
      user,
      attemptedEmail: normalizedEmail,
      status: 'success',
    });

    const userJson: any = user.toJSON();
    userJson.currentSessionId = sessionId;

    return NextResponse.json({
      success: true,
      token,
      user: userJson,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
