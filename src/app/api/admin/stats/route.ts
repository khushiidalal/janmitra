import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Case from '@/models/Case';
import DocumentModel from '@/models/Document';
import Audit from '@/models/Audit';
import SystemSetting from '@/models/SystemSetting';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectDB();

    const [
      totalUsers,
      adminCount,
      seniorOfficerCount,
      investigatorCount,
      officerCount,
      clerkCount,
      viewerCount,
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      totalDocuments,
      totalAuditLogs,
      securityAlertsCount,
      adminActionsCount,
      systemSettings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Admin' }),
      User.countDocuments({ role: 'Senior Officer' }),
      User.countDocuments({ role: 'Investigator' }),
      User.countDocuments({ role: 'Officer' }),
      User.countDocuments({ role: 'Clerk' }),
      User.countDocuments({ role: 'Viewer' }),
      Case.countDocuments(),
      Case.countDocuments({ status: 'Active' }),
      Case.countDocuments({ status: 'Pending' }),
      Case.countDocuments({ status: 'Closed' }),
      DocumentModel.countDocuments(),
      Audit.countDocuments(),
      Audit.countDocuments({ type: 'login', status: 'failed' }),
      Audit.countDocuments({ type: { $in: ['admin', 'setting', 'approval'] } }),
      SystemSetting.findOne({ key: 'global' }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          byRole: {
            Admin: adminCount,
            'Senior Officer': seniorOfficerCount,
            Investigator: investigatorCount,
            Officer: officerCount,
            Clerk: clerkCount,
            Viewer: viewerCount,
          },
        },
        cases: {
          total: totalCases,
          active: activeCases,
          pending: pendingCases,
          closed: closedCases,
        },
        documents: {
          total: totalDocuments,
        },
        audit: {
          totalLogs: totalAuditLogs,
          securityAlerts: securityAlertsCount,
          adminActions: adminActionsCount,
        },
        system: {
          maintenanceMode: systemSettings?.maintenanceMode || false,
          stationName: systemSettings?.stationName || 'Central Cyber & Forensic Jurisdiction HQ',
          systemName: systemSettings?.systemName || 'JANMITRA',
          twoFactorPolicy: systemSettings?.twoFactorPolicy || 'optional',
        },
      },
    });
  } catch (error: any) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
