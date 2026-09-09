import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { extractClientIp, parseUserAgent } from '@/lib/server/security';

interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: targetSessionId } = await context.params;
    if (!targetSessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const sessionExists = (user.sessions || []).some(
      (s) => s.sessionId === targetSessionId
    );

    if (!sessionExists) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    user.sessions = (user.sessions || []).filter(
      (s) => s.sessionId !== targetSessionId
    );
    await user.save();

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);

    try {
      await Audit.create({
        type: 'security',
        text: `Revoked session ${targetSessionId.slice(0, 8)}... for ${user.fullName}`,
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
      message: 'Device session revoked successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
