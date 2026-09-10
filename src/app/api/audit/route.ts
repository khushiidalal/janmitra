import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';

const ALLOWED_SECURITY_ROLES = [
  'Admin',
  'Senior Officer',
  'Investigator',
  'Officer',
  'Clerk',
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const caseId = searchParams.get('caseId');
    const limitParam = searchParams.get('limit');
    const sinceParam = searchParams.get('since');
    const statusParam = searchParams.get('status');

    // RBAC: Security telemetry and login activities are restricted to authorized investigative staff
    if (type === 'login' && !ALLOWED_SECURITY_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions to view security telemetry' },
        { status: 403 }
      );
    }

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

    // If a Viewer accesses general audit logs, sanitize IP addresses
    if (user.role === 'Viewer') {
      return NextResponse.json(
        logs.map((l) => {
          const json = l.toJSON();
          if (json.ipAddress) {
            delete json.ipAddress;
            delete json.userAgent;
          }
          return json;
        })
      );
    }

    return NextResponse.json(logs.map((l) => l.toJSON()));
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
