import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Audit from '@/models/Audit';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    // Audit Trail is strictly Admin-only
    const authResult = await requireAdmin(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const caseId = searchParams.get('caseId');
    const limitParam = searchParams.get('limit');
    const sinceParam = searchParams.get('since');
    const statusParam = searchParams.get('status');
    const severityParam = searchParams.get('severity');
    const search = searchParams.get('search');

    await connectDB();

    const filter: Record<string, any> = {};

    if (category === 'case') {
      filter.type = { $in: ['document', 'review', 'approval'] };
    }

    if (type) {
      filter.type = type;
    }

    if (action) {
      filter.action = action;
    }

    if (caseId) {
      filter.caseId = caseId;
    }

    if (statusParam) {
      filter.status = statusParam;
    }

    if (severityParam) {
      filter.severity = severityParam;
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!Number.isNaN(sinceDate.getTime())) {
        filter.time = { $gt: sinceDate };
      }
    }

    if (search && search.trim()) {
      const queryRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { text: queryRegex },
        { action: queryRegex },
        { target: queryRegex },
        { accessedBy: queryRegex },
        { userEmail: queryRegex },
      ];
    }

    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 500);
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
