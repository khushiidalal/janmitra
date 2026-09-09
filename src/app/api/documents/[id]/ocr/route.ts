import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import DocumentModel from '@/models/Document';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { getAbsoluteFilePath } from '@/lib/server/storage';
import { processDocumentOcr, isOcrSupported } from '@/lib/server/ocr';

interface Context {
  params: Promise<{ id: string }>;
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

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID' },
        { status: 400 }
      );
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
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
      document: doc.toJSON(),
    });
  } catch (error: any) {
    console.error('Fetch OCR status error:', error);
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

    // RBAC: Only authorized roles can trigger or re-run OCR
    if (!ALLOWED_OCR_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to trigger OCR on case documents.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID' },
        { status: 400 }
      );
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if the file format is supported
    if (!isOcrSupported(doc.mimeType, doc.fileName)) {
      return NextResponse.json(
        {
          success: false,
          error: `Document file format (${doc.mimeType || 'unknown'}) is not supported for OCR. Supported formats include PDF, JPG, JPEG, PNG, WebP, and BMP.`,
        },
        { status: 400 }
      );
    }

    const filePath = getAbsoluteFilePath(doc);
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Document storage path could not be resolved.' },
        { status: 404 }
      );
    }

    // Mark status as processing and record start audit
    doc.ocrStatus = 'processing';
    doc.ocrError = '';
    await doc.save();

    try {
      await Audit.create({
        type: 'document',
        text: `Document "${doc.name}" OCR extraction started for case ${doc.caseId}`,
        accessedBy: user.fullName || 'System',
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    // Execute OCR processing
    try {
      const ocrResult = await processDocumentOcr(filePath, doc.mimeType, doc.fileName);

      doc.ocrText = ocrResult.rawText;
      doc.normalizedOcrText = ocrResult.normalizedText;
      doc.ocrConfidence = ocrResult.confidence;
      doc.ocrQuality = ocrResult.quality;
      doc.pageCount = ocrResult.pageCount;
      doc.ocrStatus = 'completed';
      doc.ocrError = '';
      doc.ocrProcessedAt = new Date();
      await doc.save();

      try {
        await Audit.create({
          type: 'document',
          text: `Document "${doc.name}" OCR completed (${ocrResult.charCount} chars, ${ocrResult.pageCount} pages, ${ocrResult.confidence}% confidence, Quality: ${ocrResult.quality}) for case ${doc.caseId}`,
          caseId: doc.caseId,
          accessedBy: user.fullName || 'System',
          userId: user._id?.toString(),
          userRole: user.role,
          userEmail: user.email,
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
        document: doc.toJSON(),
      });
    } catch (ocrErr: any) {
      const errorMsg = ocrErr?.message || 'OCR processing failed unexpectedly.';
      console.error(`OCR processing error for document ${doc._id}:`, ocrErr);

      doc.ocrStatus = 'failed';
      doc.ocrError = errorMsg;
      await doc.save();

      try {
        await Audit.create({
          type: 'document',
          text: `Document "${doc.name}" OCR extraction failed for case ${doc.caseId}: ${errorMsg}`,
          caseId: doc.caseId,
          accessedBy: user.fullName || 'System',
          userId: user._id?.toString(),
          userRole: user.role,
          userEmail: user.email,
        });
      } catch (auditErr) {
        console.error('Audit log error:', auditErr);
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          ocrStatus: 'failed',
          document: doc.toJSON(),
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('Trigger OCR error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger OCR processing' },
      { status: 500 }
    );
  }
}
