import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import fs from 'fs';
import { connectDB } from '@/lib/db';
import DocumentModel from '@/models/Document';
import { getAbsoluteFilePath } from '@/lib/server/storage';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: Context) {
  try {
    await connectDB();
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

    const filePath = getAbsoluteFilePath(doc);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found on storage disk' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to download document' },
      { status: 500 }
    );
  }
}
