import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/server/auth';

const VALID_ROLES = ['Admin', 'Senior Officer', 'Investigator', 'Clerk', 'Viewer'];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);

    const filter: Record<string, any> = {};
    if (role && VALID_ROLES.includes(role)) {
      filter.role = role;
    }
    if (search.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
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
        users: users.map((u) => u.toJSON()),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
