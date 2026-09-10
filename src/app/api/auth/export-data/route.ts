import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Case from '@/models/Case';
import Document from '@/models/Document';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    
    const cases = await Case.find({ createdBy: user._id })
      .select('-__v')
      .lean();

    
    const documents = await Document.find({ uploadedBy: user._id })
      .select('-filePath -storageKey -__v')
      .lean();

    
    const auditLogs = await Audit.find({
      $or: [{ userId: user._id }, { userEmail: user.email }],
    })
      .select('-__v')
      .sort({ time: -1 })
      .limit(200)
      .lean();

    
    const sanitizedProfile = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      officialEmail: user.officialEmail || user.email,
      officialPhone: user.officialPhone || 'Not provided',
      role: user.role,
      department: user.department || 'Not provided',
      designation: user.designation || 'Not provided',
      employeeId: user.employeeId || 'Not provided',
      jurisdiction: user.jurisdiction || 'Not provided',
      dateOfBirth: user.dateOfBirth || 'Not provided',
      gender: user.gender || 'Not provided',
      address: user.address || 'Not provided',
      govIdType: user.govIdType || 'Not provided',
      govIdNumber: user.govIdNumber ? '••••••••' : 'Not provided', 
      joiningDate: user.joiningDate || 'Not provided',
      supervisingOfficer: user.supervisingOfficer || 'Not provided',
      twoFactorEnabled: !!user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod || 'sms',
      twoFactorLastVerified: user.twoFactorLastVerified || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const sanitizedSessions = (user.sessions || []).map((s) => ({
      sessionId: s.sessionId,
      device: s.device,
      browser: s.browser,
      operatingSystem: s.operatingSystem,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      location: s.location || 'Secure Location',
      isTrusted: s.isTrusted ?? true,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      isCurrent: s.sessionId === (user as any).currentSessionId,
    }));

    const exportPayload = {
      exportMetadata: {
        application: 'JANMITRA Police Case Management System',
        exportDate: new Date().toISOString(),
        requestingUser: user.fullName,
        requestingUserId: user._id.toString(),
        dataRetentionPolicy:
          'Pursuant to criminal procedure and statutory evidentiary retention standards, official case records, FIR documents, and chain-of-custody audit logs are preserved permanently as legal evidence. User authentication tokens expire every 7 days.',
      },
      accountInformation: sanitizedProfile,
      preferences: user.preferences || {
        language: 'English (US)',
        textSize: 'Medium',
        highContrast: false,
      },
      securityAndSessions: {
        twoFactorAuthentication: {
          enabled: !!user.twoFactorEnabled,
          method: user.twoFactorMethod || 'sms',
          lastVerified: user.twoFactorLastVerified || null,
        },
        activeSessions: sanitizedSessions,
      },
      casesCreated: cases.map((c: any) => ({
        caseId: c.caseId,
        title: c.title,
        status: c.status,
        category: c.category,
        incidentDate: c.incidentDate,
        location: c.location,
        description: c.description,
        peopleCount: c.people?.length || 0,
        documentsCount: c.documents?.length || 0,
        createdAt: c.createdAt,
      })),
      documentsUploaded: documents.map((d: any) => ({
        id: d._id?.toString(),
        caseId: d.caseId,
        name: d.name,
        documentType: d.documentType,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        ocrStatus: d.ocrStatus,
        createdAt: d.createdAt,
      })),
      auditTrail: auditLogs.map((a: any) => ({
        id: a._id?.toString(),
        time: a.time,
        type: a.type,
        text: a.text,
        status: a.status,
        ipAddress: a.ipAddress,
        severity: a.severity,
      })),
    };

    const sanitizedFilename = `janmitra-data-export-${(user.employeeId || user.fullName || 'user')
      .replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export user data' },
      { status: 500 }
    );
  }
}
