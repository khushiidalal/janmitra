import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DocumentModel, { DOCUMENT_TYPES } from '@/models/Document';
import Case from '@/models/Case';
import Audit from '@/models/Audit';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { saveUploadedFile } from '@/lib/server/storage';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, any> = {};
    const caseId = searchParams.get('caseId');
    const documentType = searchParams.get('documentType');
    const search = searchParams.get('search');

    if (caseId) filter.caseId = caseId;
    if (documentType && DOCUMENT_TYPES.includes(documentType as any)) {
      filter.documentType = documentType;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { caseId: { $regex: search, $options: 'i' } },
        { ocrText: { $regex: search, $options: 'i' } },
      ];
    }

    const docs = await DocumentModel.find(filter)
      .populate('uploadedBy', 'fullName role email')
      .sort({ createdAt: -1 });

    return NextResponse.json(docs.map((d) => d.toJSON()));
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    const formData = await req.formData();

    const caseId = formData.get('caseId') as string;
    const name = formData.get('name') as string;
    const documentType = formData.get('documentType') as string;
    const description = (formData.get('description') as string) || '';
    const file = formData.get('file') as File | null;

    if (!caseId || !name || !documentType || !file) {
      return NextResponse.json(
        { success: false, error: 'caseId, name, documentType, and file are required' },
        { status: 400 }
      );
    }

    const parentCase = await Case.findOne({ caseId });
    const storageMeta = await saveUploadedFile(file);

    const doc = (await DocumentModel.create({
      caseId,
      caseObjectId: parentCase?._id,
      name: name.trim(),
      documentType: documentType as any,
      description: description.trim(),
      fileName: storageMeta.fileName,
      mimeType: storageMeta.mimeType,
      fileSize: storageMeta.fileSize,
      storageProvider: storageMeta.storageProvider,
      storageKey: storageMeta.storageKey,
      filePath: storageMeta.filePath,
      sha256: storageMeta.sha256,
      ocrStatus: 'not_started',
      uploadedBy: user?._id,
    })) as any;

    try {
      await Audit.create({
        type: 'document',
        text: `Document "${doc.name}" uploaded to case ${caseId}`,
        accessedBy: user?.fullName || 'System',
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json(doc.toJSON(), { status: 201 });
  } catch (error: any) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
