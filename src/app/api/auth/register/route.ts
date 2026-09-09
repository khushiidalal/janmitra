import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Audit from '@/models/Audit';
import { signToken } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      fullName,
      email,
      password,
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

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
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
    });

    try {
      await Audit.create({
        type: 'registration',
        text: `New user ${user.fullName} registered successfully`,
        accessedBy: user.fullName,
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    const token = signToken(user);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        token,
        user: user.toJSON(),
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
