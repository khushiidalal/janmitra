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
    const { id } = await context.params;
    const updates = await req.json();

    const foundCase = await findCaseById(id);
    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

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
      await Audit.create({
        type: 'review',
        text: `Case ${foundCase.caseId} was updated`,
        accessedBy: user?.fullName || 'System',
      });
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
        accessedBy: user?.fullName || 'System',
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
