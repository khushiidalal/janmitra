import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator access required' },
        { status: 403 }
      );
    }

    if (user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only administrators can view the audit trail' },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const caseId = searchParams.get('caseId');
    const limitParam = searchParams.get('limit');
    const sinceParam = searchParams.get('since');
    const statusParam = searchParams.get('status');

    
    await connectDB();

    const filter: Record<string, any> = {};

    if (category === 'case') {
      filter.type = { $in: ['document', 'review', 'approval'] };
    }

    if (type) {
      filter.type = type;
    }

    if (caseId) {
      filter.caseId = caseId;
    }

    if (statusParam) {
      filter.status = statusParam;
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!Number.isNaN(sinceDate.getTime())) {
        filter.time = { $gt: sinceDate };
      }
    }

    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 200);
      }
    }

    const logs = await Audit.find(filter).sort({ time: -1 }).limit(limit);

    
    return NextResponse.json(logs.map((l) => l.toJSON()));
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
