import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Case from '@/models/Case';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { processDocumentOcr, isOcrSupported } from '@/lib/server/ocr';

interface Context {
  params: Promise<{ id: string; docId: string }>;
}

const ALLOWED_OCR_ROLES = ['Admin', 'Senior Officer', 'Investigator', 'Officer', 'Clerk'];

export async function GET(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id, docId } = await context.params;
    const decodedId = decodeURIComponent(id);
    const foundCase = await Case.findOne({
      $or: [
        { caseId: decodedId },
        ...(mongoose.Types.ObjectId.isValid(decodedId) ? [{ _id: decodedId }] : []),
      ],
    });

    if (!foundCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    const doc = (foundCase.documents || []).find(
      (d: any) =>
        (d._id && d._id.toString() === docId) ||
        d.id === docId ||
        String(d._id) === docId
    );

    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found in case' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ocrStatus: doc.ocrStatus || 'not_started',
      ocrText: doc.ocrText || '',
      normalizedOcrText: doc.normalizedOcrText || doc.ocrText || '',
      ocrConfidence: doc.ocrConfidence ?? null,
      ocrQuality: doc.ocrQuality || null,
      pageCount: doc.pageCount || 1,
      ocrError: doc.ocrError || '',
      ocrProcessedAt: doc.ocrProcessedAt || null,
      sha256: doc.sha256 || '',
      document: doc,
    });
  } catch (error: any) {
    console.error('Fetch case document OCR status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch OCR status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: Context) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id, docId } = await context.params;
    const decodedId = decodeURIComponent(id);
    const foundCase = await Case.findOne({
      $or: [
        { caseId: decodedId },
        ...(mongoose.Types.ObjectId.isValid(decodedId) ? [{ _id: decodedId }] : []),
      ],
    });

    if (!foundCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // RBAC: Check if user is an officer/investigator or the creator of the case
    const isCreator = foundCase.createdBy && String(foundCase.createdBy) === String(user._id);
    const hasRolePermission = ALLOWED_OCR_ROLES.includes(user.role);

    if (!hasRolePermission && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to trigger OCR on this case.' },
        { status: 403 }
      );
    }

    const doc = (foundCase.documents || []).find(
      (d: any) =>
        (d._id && d._id.toString() === docId) ||
        d.id === docId ||
        String(d._id) === docId
    );

    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found in case' }, { status: 404 });
    }

    if (!doc.dataUrl) {
      return NextResponse.json(
        { success: false, error: 'Document does not contain file data to process.' },
        { status: 400 }
      );
    }

    // Extract MIME type from dataUrl if present (e.g. data:image/png;base64,...)
    let mimeType = 'application/octet-stream';
    if (doc.dataUrl.startsWith('data:')) {
      const match = doc.dataUrl.match(/^data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    } else if (doc.type === 'PDF' || (doc.name || '').toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (doc.type === 'PNG' || (doc.name || '').toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (['JPG', 'JPEG'].includes(doc.type || '') || /\.(jpe?g)$/i.test(doc.name || '')) {
      mimeType = 'image/jpeg';
    }

    if (!isOcrSupported(mimeType, doc.name)) {
      return NextResponse.json(
        {
          success: false,
          error: `Document format (${mimeType}) is not supported for OCR. Supported formats: PDF, JPG, PNG, WebP, BMP.`,
        },
        { status: 400 }
      );
    }

    // Parse base64 data to buffer
    const base64Content = doc.dataUrl.includes(',')
      ? doc.dataUrl.split(',')[1]
      : doc.dataUrl;

    const buffer = Buffer.from(base64Content, 'base64');
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    doc.sha256 = sha256;
    doc.ocrStatus = 'processing';
    doc.ocrError = '';
    await foundCase.save();

    try {
      await Audit.create({
        type: 'document',
        text: `Document "${doc.name}" OCR extraction started for case ${foundCase.caseId}`,
        accessedBy: user.fullName || 'System',
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    try {
      const ocrResult = await processDocumentOcr(buffer, mimeType, doc.name);

      doc.ocrText = ocrResult.rawText;
      doc.normalizedOcrText = ocrResult.normalizedText;
      doc.ocrConfidence = ocrResult.confidence;
      doc.ocrQuality = ocrResult.quality;
      doc.pageCount = ocrResult.pageCount;
      doc.ocrStatus = 'completed';
      doc.ocrError = '';
      doc.ocrProcessedAt = new Date();
      await foundCase.save();

      try {
        await Audit.create({
          type: 'document',
          text: `Document "${doc.name}" OCR completed (${ocrResult.charCount} chars, ${ocrResult.pageCount} pages, ${ocrResult.confidence}% confidence, Quality: ${ocrResult.quality}) for case ${foundCase.caseId}`,
          accessedBy: user.fullName || 'System',
        });
      } catch (auditErr) {
        console.error('Audit log error:', auditErr);
      }

      return NextResponse.json({
        success: true,
        message: 'OCR extraction completed successfully.',
        ocrStatus: 'completed',
        ocrText: doc.ocrText,
        normalizedOcrText: doc.normalizedOcrText,
        ocrConfidence: doc.ocrConfidence,
        ocrQuality: doc.ocrQuality,
        pageCount: doc.pageCount,
        ocrProcessedAt: doc.ocrProcessedAt,
        sha256: doc.sha256,
        document: doc,
      });
    } catch (ocrErr: any) {
      const errorMsg = ocrErr?.message || 'OCR processing failed unexpectedly.';
      console.error(`OCR processing error on case document ${doc.name}:`, ocrErr);

      doc.ocrStatus = 'failed';
      doc.ocrError = errorMsg;
      await foundCase.save();

      try {
        await Audit.create({
          type: 'document',
          text: `Document "${doc.name}" OCR extraction failed for case ${foundCase.caseId}: ${errorMsg}`,
          accessedBy: user.fullName || 'System',
        });
      } catch (auditErr) {
        console.error('Audit log error:', auditErr);
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          ocrStatus: 'failed',
          document: doc,
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('Trigger case document OCR error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger OCR processing' },
      { status: 500 }
    );
  }
}
