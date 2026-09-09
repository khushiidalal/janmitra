import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { extractClientIp, parseUserAgent } from '@/lib/server/security';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      twoFactorEnabled: !!user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod || 'sms',
      twoFactorLastVerified: user.twoFactorLastVerified || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { enabled, method = 'sms' } = body;

    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    user.twoFactorEnabled = Boolean(enabled);
    user.twoFactorMethod = method;
    if (user.twoFactorEnabled) {
      user.twoFactorLastVerified = new Date();
    }

    await user.save();

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);

    try {
      await Audit.create({
        type: 'security',
        text: `Two-Factor Authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'} for ${user.fullName}`,
        accessedBy: user.fullName,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        browser,
        operatingSystem,
        deviceType,
        status: 'success',
      });
    } catch (auditErr) {
      console.error('Audit error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
      twoFactorLastVerified: user.twoFactorLastVerified,
      message: `Two-factor authentication has been ${user.twoFactorEnabled ? 'enabled' : 'disabled'} successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update 2FA status' },
      { status: 500 }
    );
  }
}
