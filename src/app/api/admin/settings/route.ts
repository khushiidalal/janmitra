import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';
import { requireAdmin } from '@/lib/server/auth';
import { recordAdminAction } from '@/lib/server/audit';

async function getOrCreateGlobalSettings() {
  let settings = await SystemSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await SystemSetting.create({
      key: 'global',
      systemName: 'JANMITRA - Legal Investigation System',
      stationName: 'Central Cyber & Forensic Jurisdiction HQ',
      maintenanceMode: false,
      announcement: '',
      twoFactorPolicy: 'optional',
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5,
      allowSelfRegistration: true,
      ocrAutoProcess: true,
      defaultCaseCategory: 'Theft',
      updatedBy: 'System Default',
    });
  }
  return settings;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectDB();
    const settings = await getOrCreateGlobalSettings();

    return NextResponse.json({
      success: true,
      settings: settings.toJSON(),
    });
  } catch (error: any) {
    console.error('Fetch system settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const adminUser = authResult.user;

    const body = await req.json();
    await connectDB();

    const current = await getOrCreateGlobalSettings();
    const beforeState: Record<string, any> = {};
    const afterState: Record<string, any> = {};

    const allowedKeys: (keyof typeof body)[] = [
      'systemName',
      'stationName',
      'maintenanceMode',
      'announcement',
      'twoFactorPolicy',
      'sessionTimeoutMinutes',
      'maxLoginAttempts',
      'allowSelfRegistration',
      'ocrAutoProcess',
      'defaultCaseCategory',
    ];

    let hasChanges = false;

    for (const key of allowedKeys) {
      if (body[key] !== undefined && (current as any)[key] !== body[key]) {
        beforeState[key] = (current as any)[key];
        afterState[key] = body[key];
        (current as any)[key] = body[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      current.updatedBy = adminUser.fullName || adminUser.email;
      current.updatedByEmail = adminUser.email;
      await current.save();

      const changedFieldNames = Object.keys(afterState).join(', ');

      await recordAdminAction({
        req,
        user: adminUser,
        action: 'SYSTEM_SETTINGS_UPDATED',
        target: 'System Settings Configuration',
        targetType: 'Setting',
        targetId: current._id.toString(),
        type: 'setting',
        text: `Admin updated system settings: modified [${changedFieldNames}]`,
        severity: afterState.maintenanceMode ? 'warning' : 'info',
        changes: {
          before: beforeState,
          after: afterState,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: hasChanges ? 'Settings updated successfully' : 'No changes detected',
      settings: current.toJSON(),
      changes: hasChanges ? { before: beforeState, after: afterState } : null,
    });
  } catch (error: any) {
    console.error('Update system settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
