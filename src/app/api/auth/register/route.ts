import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import { signToken } from '@/lib/server/auth';
import { extractClientIp, parseUserAgent } from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      fullName,
      email,
      password,
      role,
      dateOfBirth,
      gender,
      govIdType,
      govIdNumber,
      address,
      department,
      designation,
      employeeId,
      jurisdiction,
      joiningDate,
      supervisingOfficer,
      officialEmail,
      officialPhone,
      profilePhoto,
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

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

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: role && ['Admin', 'Senior Officer', 'Investigator', 'Officer', 'Clerk', 'Viewer'].includes(role) ? role : 'Officer',
      dateOfBirth: dateOfBirth?.trim() || '',
      gender: gender?.trim() || '',
      govIdType: govIdType?.trim() || '',
      govIdNumber: govIdNumber?.trim() || '',
      address: address?.trim() || '',
      department: department?.trim() || '',
      designation: designation?.trim() || '',
      employeeId: employeeId?.trim() || '',
      jurisdiction: jurisdiction?.trim() || '',
      joiningDate: joiningDate?.trim() || '',
      supervisingOfficer: supervisingOfficer?.trim() || '',
      officialEmail: (officialEmail || normalizedEmail).trim().toLowerCase(),
      officialPhone: officialPhone?.trim() || '',
      profilePhoto: typeof profilePhoto === 'string' ? profilePhoto : '',
      sessions: [newSession],
    });

    try {
      await Audit.create({
        type: 'registration',
        text: `New user ${user.fullName} registered successfully`,
        accessedBy: user.fullName,
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    const token = signToken(user, sessionId);

    const userJson: any = user.toJSON();
    userJson.currentSessionId = sessionId;

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        token,
        user: userJson,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
