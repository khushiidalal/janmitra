import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import EmailOTP from '@/models/EmailOTP';
import { isAuthorizedAdmin, setAuthCookie, signToken } from '@/lib/server/auth';
import { extractClientIp, parseUserAgent } from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
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
      governmentId,
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

    const match = typeof governmentId?.data === "string" && governmentId.data.length <= 2800000
      ? /^data:(application\/pdf|image\/jpeg|image\/png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(governmentId.data)
      : null;
    if (!match || typeof governmentId?.name !== "string" || !governmentId.name.trim() || governmentId.name.length > 255) {
      return NextResponse.json({ success: false, error: "Government ID is required. Upload a PDF, JPG or PNG up to 2 MB." }, { status: 400 });
    }
    const idData = Buffer.from(match[2], "base64");
    const validSignature = match[1] === "application/pdf" ? idData.subarray(0, 5).toString() === "%PDF-"
      : match[1] === "image/png" ? idData.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : idData[0] === 255 && idData[1] === 216 && idData[2] === 255;
    if (!idData.length || idData.length > 2 * 1024 * 1024 || !validSignature) {
      return NextResponse.json({ success: false, error: "Invalid Government ID file. Upload a valid PDF, JPG or PNG up to 2 MB." }, { status: 400 });
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const verification = await EmailOTP.findOne({
      email: normalizedEmail,
      verified: true,
      expiresAt: { $gt: new Date() },
    });
    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Verify this email address before registering' },
        { status: 403 }
      );
    }

    const isAllowlistedAdmin = await isAuthorizedAdmin({ email: normalizedEmail, emailVerified: true });
    const registrationDesignation =
      typeof designation === 'string' ? designation.trim() :
      typeof role === 'string' ? role.trim() : '';

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
      role: isAllowlistedAdmin ? 'Admin' : 'Viewer',
      emailVerified: true,
      dateOfBirth: dateOfBirth?.trim() || '',
      gender: gender?.trim() || '',
      govIdType: govIdType?.trim() || '',
      govIdNumber: govIdNumber?.trim() || '',
      address: address?.trim() || '',
      department: department?.trim() || '',
      designation: registrationDesignation,
      governmentId: { name: governmentId.name.trim(), contentType: match[1], data: idData },
      employeeId: employeeId?.trim() || '',
      jurisdiction: jurisdiction?.trim() || '',
      joiningDate: joiningDate?.trim() || '',
      supervisingOfficer: supervisingOfficer?.trim() || '',
      officialEmail: (officialEmail || normalizedEmail).trim().toLowerCase(),
      officialPhone: officialPhone?.trim() || '',
      profilePhoto: typeof profilePhoto === 'string' ? profilePhoto : '',
      sessions: [newSession],
    });
    await EmailOTP.deleteOne({ _id: verification._id, verified: true });

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

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        token,
        user: userJson,
      },
      { status: 201 }
    );
    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
