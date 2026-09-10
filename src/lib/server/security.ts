import type { NextRequest } from 'next/server';
import Audit from '@/models/Audit';
import type { IUser } from '@/models/User';

export interface ParsedUserAgent {
  browser: string;
  operatingSystem: string;
  deviceType: string;
}


export function extractClientIp(req: NextRequest): string {
  
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return normalizeIp(cfConnectingIp.trim());
  }

  
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor && forwardedFor.trim()) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return normalizeIp(realIp.trim());
  }

  
  if ((req as any).ip) {
    return normalizeIp(String((req as any).ip).trim());
  }

  return '127.0.0.1';
}

function normalizeIp(ip: string): string {
  if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
    return '127.0.0.1';
  }
  
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
}


export function parseUserAgent(uaString: string | null): ParsedUserAgent {
  if (!uaString || typeof uaString !== 'string') {
    return {
      browser: 'Unknown',
      operatingSystem: 'Unknown',
      deviceType: 'Desktop',
    };
  }

  const ua = uaString;

  
  let deviceType = 'Desktop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  
  let operatingSystem = 'Unknown';
  if (/Windows NT/i.test(ua)) {
    operatingSystem = 'Windows';
  } else if (/iPhone|iPod/i.test(ua)) {
    operatingSystem = 'iOS';
  } else if (/iPad/i.test(ua)) {
    operatingSystem = 'iPadOS';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    operatingSystem = 'macOS';
  } else if (/Android/i.test(ua)) {
    operatingSystem = 'Android';
  } else if (/Linux/i.test(ua)) {
    operatingSystem = 'Linux';
  }

  
  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera\//i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome\/|CriOS\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox\/|FxiOS\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(ua) && !/Chrome\/|CriOS\//i.test(ua)) {
    browser = 'Safari';
  } else if (/MSIE|Trident\//i.test(ua)) {
    browser = 'Internet Explorer';
  }

  return { browser, operatingSystem, deviceType };
}

export interface RecordLoginParams {
  req: NextRequest;
  user?: IUser | null;
  attemptedEmail: string;
  status: 'success' | 'failed';
}


export async function recordLoginSecurityEvent(params: RecordLoginParams) {
  const { req, user, attemptedEmail, status } = params;

  try {
    const ipAddress = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);
    const normalizedEmail = attemptedEmail.toLowerCase().trim();

    if (status === 'success' && user) {
      
      const previousLogins = await Audit.find({
        userId: user._id,
        type: 'login',
        status: 'success',
      })
        .sort({ time: -1 })
        .limit(20)
        .lean();

      let isUnusual = false;
      let unusualReason = 'Normal login from verified device and IP';
      let severity: 'info' | 'warning' | 'critical' = 'info';

      if (previousLogins.length === 0) {
        
        isUnusual = false;
        unusualReason = 'Initial login session established';
        severity = 'info';
      } else {
        const knownIps = new Set(
          previousLogins.map((l: any) => l.ipAddress).filter(Boolean)
        );
        const knownDevices = new Set(
          previousLogins
            .map((l: any) => `${l.browser} • ${l.operatingSystem}`)
            .filter(Boolean)
        );

        const currentDevice = `${browser} • ${operatingSystem}`;
        const isNewIp = ipAddress !== 'Unknown' && !knownIps.has(ipAddress);
        const isNewDevice =
          browser !== 'Unknown' &&
          operatingSystem !== 'Unknown' &&
          !knownDevices.has(currentDevice);

        if (isNewIp && isNewDevice) {
          isUnusual = true;
          unusualReason = `Login from new IP address (${ipAddress}) and new device (${currentDevice})`;
          severity = 'warning';
        } else if (isNewIp) {
          isUnusual = true;
          unusualReason = `Login from new IP address (${ipAddress})`;
          severity = 'warning';
        } else if (isNewDevice) {
          isUnusual = true;
          unusualReason = `Login from new device (${currentDevice})`;
          severity = 'warning';
        }
      }

      await Audit.create({
        type: 'login',
        text: isUnusual
          ? `Unusual login detected for ${user.fullName} (${unusualReason})`
          : `User ${user.fullName} logged in successfully`,
        accessedBy: user.fullName,
        userId: user._id,
        userEmail: user.email || normalizedEmail,
        userRole: user.role,
        ipAddress,
        userAgent,
        browser,
        operatingSystem,
        deviceType,
        status: 'success',
        isUnusual,
        unusualReason,
        severity,
        time: new Date(),
      });
    } else {
      
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentFailures = await Audit.countDocuments({
        type: 'login',
        status: 'failed',
        $or: [{ ipAddress }, { userEmail: normalizedEmail }],
        time: { $gte: fifteenMinutesAgo },
      });

      const failureCount = recentFailures + 1;
      const isMultiple = failureCount >= 3;

      await Audit.create({
        type: 'login',
        text: isMultiple
          ? `Multiple failed login attempts detected for ${normalizedEmail} (${failureCount} attempts)`
          : `Failed login attempt for ${normalizedEmail}`,
        accessedBy: user?.fullName || normalizedEmail || 'Unknown User',
        userId: user?._id || undefined,
        userEmail: normalizedEmail,
        userRole: user?.role || 'Unauthenticated',
        ipAddress,
        userAgent,
        browser,
        operatingSystem,
        deviceType,
        status: 'failed',
        isUnusual: true,
        unusualReason: isMultiple
          ? `Multiple failed attempts (${failureCount} in 15 mins)`
          : 'Invalid credentials provided',
        severity: isMultiple ? 'critical' : 'warning',
        time: new Date(),
      });
    }
  } catch (error) {
    
    console.error('Failed to record login security audit event:', error);
  }
}
