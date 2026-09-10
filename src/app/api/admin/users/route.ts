import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/server/auth';
import { recordAdminAction } from '@/lib/server/audit';

const VALID_ROLES = ['Admin', 'Senior Officer', 'Investigator', 'Officer', 'Clerk', 'Viewer'];

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 25)));

    const filter: Record<string, any> = {};
    if (role && VALID_ROLES.includes(role)) {
      filter.role = role;
    }
    if (search.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { department: { $regex: search.trim(), $options: 'i' } },
        { designation: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        users: users.map((u) => u.toJSON()),
      },
    });
  } catch (error: any) {
    console.error('Admin fetch users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const adminUser = authResult.user;

    const body = await req.json();
    const {
      fullName,
      email,
      password,
      role = 'Viewer',
      department = '',
      designation = '',
      officialEmail = '',
      officialPhone = '',
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and temporary password are required' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists' },
        { status: 409 }
      );
    }

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role,
      department: department.trim(),
      designation: designation.trim(),
      officialEmail: officialEmail.trim().toLowerCase(),
      officialPhone: officialPhone.trim(),
      preferences: {
        language: 'English (US)',
        textSize: 'Medium',
        highContrast: false,
      },
    });

    await recordAdminAction({
      req,
      user: adminUser,
      action: 'USER_CREATED',
      target: `User: ${newUser.fullName} (${newUser.email})`,
      targetId: newUser._id.toString(),
      targetType: 'User',
      type: 'admin',
      text: `Admin created new user account for ${newUser.fullName} with role "${newUser.role}"`,
      changes: {
        after: {
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          designation: newUser.designation,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `User ${newUser.fullName} created successfully`,
        user: newUser.toJSON(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
