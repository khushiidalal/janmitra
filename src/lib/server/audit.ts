import type { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Audit, { type IAudit } from '@/models/Audit';
import type { IUser } from '@/models/User';
import { extractClientIp, parseUserAgent } from './security';

export interface RecordAdminActionParams {
  req?: NextRequest;
  user: IUser | { _id?: any; fullName?: string; email?: string; role?: string };
  action: string;
  target?: string;
  targetId?: string;
  targetType?: 'User' | 'Case' | 'Document' | 'Setting' | 'System' | 'Auth';
  text: string;
  type?: 'admin' | 'setting' | 'document' | 'review' | 'login' | 'approval' | 'registration' | 'security';
  status?: 'success' | 'failed';
  severity?: 'info' | 'warning' | 'critical';
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

/**
 * Records an immutable administrative audit log with before/after diffs,
 * contextual device/IP metadata, and target references.
 */
export async function recordAdminAction(params: RecordAdminActionParams): Promise<IAudit | null> {
  const {
    req,
    user,
    action,
    target,
    targetId,
    targetType,
    text,
    type = 'admin',
    status = 'success',
    severity = 'info',
    changes,
  } = params;

  try {
    let ipAddress = '127.0.0.1';
    let userAgent = '';
    let browser = 'Unknown';
    let operatingSystem = 'Unknown';
    let deviceType = 'Desktop';

    if (req) {
      ipAddress = extractClientIp(req);
      userAgent = req.headers.get('user-agent') || '';
      const parsed = parseUserAgent(userAgent);
      browser = parsed.browser;
      operatingSystem = parsed.operatingSystem;
      deviceType = parsed.deviceType;
    }

    await connectDB();

    const auditEntry = await Audit.create({
      type,
      action,
      target,
      targetId,
      targetType,
      text,
      accessedBy: user.fullName || user.email || 'Admin',
      userId: user._id,
      userEmail: user.email,
      userRole: user.role || 'Admin',
      ipAddress,
      userAgent,
      browser,
      operatingSystem,
      deviceType,
      status,
      severity,
      changes: changes
        ? {
            before: changes.before || undefined,
            after: changes.after || undefined,
          }
        : undefined,
      time: new Date(),
    });

    return auditEntry;
  } catch (error) {
    console.error('Failed to record administrative audit action:', error);
    return null;
  }
}
