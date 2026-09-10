import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { recordAdminAction } from '@/lib/server/audit';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.toJSON() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { fullName, role, department, designation, officialEmail, officialPhone } = body;

    if (role !== undefined && currentUser.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only administrators can modify user roles' },
        { status: 403 }
      );
    }

    if (currentUser.role !== 'Admin' && String(currentUser._id) !== String(id)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      );
    }

    const beforeState: Record<string, any> = {};
    const afterState: Record<string, any> = {};

    if (fullName !== undefined && user.fullName !== fullName.trim()) {
      beforeState.fullName = user.fullName;
      afterState.fullName = fullName.trim();
      user.fullName = fullName.trim();
    }

    if (role !== undefined && user.role !== role) {
      beforeState.role = user.role;
      afterState.role = role;
      user.role = role;
    }

    if (currentUser.role === 'Admin') {
      if (department !== undefined && user.department !== department.trim()) {
        beforeState.department = user.department;
        afterState.department = department.trim();
        user.department = department.trim();
      }
      if (designation !== undefined && user.designation !== designation.trim()) {
        beforeState.designation = user.designation;
        afterState.designation = designation.trim();
        user.designation = designation.trim();
      }
      if (officialEmail !== undefined && user.officialEmail !== officialEmail.trim().toLowerCase()) {
        beforeState.officialEmail = user.officialEmail;
        afterState.officialEmail = officialEmail.trim().toLowerCase();
        user.officialEmail = officialEmail.trim().toLowerCase();
      }
      if (officialPhone !== undefined && user.officialPhone !== officialPhone.trim()) {
        beforeState.officialPhone = user.officialPhone;
        afterState.officialPhone = officialPhone.trim();
        user.officialPhone = officialPhone.trim();
      }
    }

    await user.save();

    if (Object.keys(afterState).length > 0) {
      const isRoleChange = beforeState.role !== undefined;
      await recordAdminAction({
        req,
        user: currentUser,
        action: isRoleChange ? 'USER_ROLE_UPDATED' : 'USER_UPDATED',
        target: `User: ${user.fullName} (${user.email})`,
        targetId: user._id.toString(),
        targetType: 'User',
        type: 'admin',
        text: isRoleChange
          ? `Admin changed role of ${user.fullName} from "${beforeState.role}" to "${afterState.role}"`
          : `User profile "${user.fullName}" (${user.email}) was updated`,
        severity: isRoleChange ? 'warning' : 'info',
        changes: {
          before: beforeState,
          after: afterState,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: user.toJSON(),
      changes: Object.keys(afterState).length > 0 ? { before: beforeState, after: afterState } : null,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only administrators can delete users' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    if (String(id) === String(currentUser._id)) {
      return NextResponse.json({ success: false, error: 'You cannot delete your own account' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { fullName, email, role, department } = user;
    await User.findByIdAndDelete(id);

    await recordAdminAction({
      req,
      user: currentUser,
      action: 'USER_DELETED',
      target: `User: ${fullName} (${email})`,
      targetId: id,
      targetType: 'User',
      type: 'admin',
      text: `Admin deleted user account for "${fullName}" (${email}, role: ${role})`,
      severity: 'critical',
      changes: {
        before: { fullName, email, role, department },
      },
    });

    return NextResponse.json({ success: true, data: { message: `User "${fullName}" deleted successfully` } });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
