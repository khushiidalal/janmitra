import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { extractClientIp, parseUserAgent } from '@/lib/server/security';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentSessionId = (authUser as any).currentSessionId;
    const sessions = (authUser.sessions || []).map((s) => ({
      sessionId: s.sessionId,
      device: s.device,
      browser: s.browser,
      operatingSystem: s.operatingSystem,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      location: s.location || 'Secure Location',
      isTrusted: s.isTrusted ?? true,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      isCurrent: s.sessionId === currentSessionId,
    })).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    return NextResponse.json({
      success: true,
      sessions,
      currentSessionId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentSessionId = (authUser as any).currentSessionId;
    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Keep only the current session
    user.sessions = (user.sessions || []).filter(
      (s) => s.sessionId === currentSessionId
    );
    await user.save();

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);

    try {
      await Audit.create({
        type: 'security',
        text: `Signed out of all other sessions for ${user.fullName}`,
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
      message: 'Successfully signed out of all other sessions',
      sessions: user.sessions.map((s) => ({
        sessionId: s.sessionId,
        device: s.device,
        browser: s.browser,
        operatingSystem: s.operatingSystem,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        location: s.location || 'Secure Location',
        isTrusted: s.isTrusted ?? true,
        createdAt: s.createdAt,
        lastActive: s.lastActive,
        isCurrent: true,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to revoke other sessions' },
      { status: 500 }
    );
  }
}
