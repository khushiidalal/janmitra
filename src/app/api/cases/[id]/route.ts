import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Case from '@/models/Case';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';

interface Context {
  params: Promise<{ id: string }>;
}

async function findCaseById(id: string) {
  const decoded = decodeURIComponent(id);
  let found = await Case.findOne({ caseId: decoded });
  if (!found && mongoose.Types.ObjectId.isValid(decoded)) {
    found = await Case.findById(decoded);
  }
  return found;
}

export async function GET(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const foundCase = await findCaseById(id);

    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(foundCase.toJSON());
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allowedEditRoles = [
      'Admin',
      'Senior Officer',
      'Investigator',
      'Officer',
    ];

    if (!allowedEditRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const updates = await req.json();

    const foundCase = await findCaseById(id);
    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const oldStatus = foundCase.status;
    const oldPeopleCount = (foundCase.people || []).length;

    const allowed = [
      'title',
      'incidentDate',
      'time',
      'location',
      'category',
      'description',
      'status',
      'date',
      'people',
      'documents',
    ];

    allowed.forEach((field) => {
      if (updates[field] !== undefined) {
        (foundCase as any)[field] = updates[field];
      }
    });

    await foundCase.save();

    try {
      if (updates.status && updates.status !== oldStatus) {
        if (updates.status === 'Closed') {
          await Audit.create({
            type: 'approval',
            text: `Case verification completed in ${foundCase.caseId}`,
            caseId: foundCase.caseId,
            accessedBy: user?.fullName || 'System',
            userId: user?._id?.toString(),
            userRole: user?.role,
            userEmail: user?.email,
          });
        } else if (updates.status.toLowerCase().includes('pending') || updates.status === 'Pending') {
          await Audit.create({
            type: 'review',
            text: `Case moved to pending review (${foundCase.caseId})`,
            caseId: foundCase.caseId,
            accessedBy: user?.fullName || 'System',
            userId: user?._id?.toString(),
            userRole: user?.role,
            userEmail: user?.email,
          });
        } else {
          await Audit.create({
            type: 'review',
            text: `Case ${foundCase.caseId} moved to ${updates.status}`,
            caseId: foundCase.caseId,
            accessedBy: user?.fullName || 'System',
            userId: user?._id?.toString(),
            userRole: user?.role,
            userEmail: user?.email,
          });
        }
      }

      if (
        updates.people &&
        Array.isArray(updates.people) &&
        updates.people.length > oldPeopleCount
      ) {
        await Audit.create({
          type: 'approval',
          text: `Officer assigned to ${foundCase.caseId}`,
          caseId: foundCase.caseId,
          accessedBy: user?.fullName || 'System',
          userId: user?._id?.toString(),
          userRole: user?.role,
          userEmail: user?.email,
        });
      } else if (!updates.status || updates.status === oldStatus) {
        await Audit.create({
          type: 'review',
          text: `Case ${foundCase.caseId} was updated`,
          caseId: foundCase.caseId,
          accessedBy: user?.fullName || 'System',
          userId: user?._id?.toString(),
          userRole: user?.role,
          userEmail: user?.email,
        });
      }
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json(foundCase.toJSON());
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const allowedDeleteRoles = ['Admin', 'Senior Officer', 'Investigator'];
    if (!allowedDeleteRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions to delete cases' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const foundCase = await findCaseById(id);
    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    await Case.deleteOne({ _id: foundCase._id });

    try {
      await Audit.create({
        type: 'review',
        text: `Case ${foundCase.caseId} was deleted`,
        caseId: foundCase.caseId,
        accessedBy: user?.fullName || 'System',
        userId: user?._id?.toString(),
        userRole: user?.role,
        userEmail: user?.email,
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Case deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete case' },
      { status: 500 }
    );
  }
}
