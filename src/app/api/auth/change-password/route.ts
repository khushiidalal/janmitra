import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { extractClientIp, parseUserAgent } from '@/lib/server/security';

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Query user with password selected
    const user = await User.findById(authUser._id).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password' },
        { status: 400 }
      );
    }

    user.password = newPassword;
    await user.save();

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);

    try {
      await Audit.create({
        type: 'security',
        text: `Password updated for officer ${user.fullName}`,
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
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
