import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');
type StoredFileReference = { storageProvider?: string; storageKey?: string; filePath?: string };
type StorageMetadata = {
  storageProvider: 'local' | 'MongoDB';
  storageKey: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
};

function getGridFsBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB is not connected; document storage is unavailable.');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'documents' });
}

function isServerlessRuntime() {
  return process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export async function saveUploadedFile(file: File): Promise<StorageMetadata> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (isServerlessRuntime()) {
    const bucket = getGridFsBucket();
    const upload = bucket.openUploadStream(safeName, {
      metadata: { mimeType: file.type || 'application/octet-stream', sha256 },
    });
    await new Promise<void>((resolve, reject) => {
      upload.once('error', reject);
      upload.once('finish', resolve);
      upload.end(buffer);
    });

    return {
      storageProvider: 'MongoDB',
      storageKey: String(upload.id),
      filePath: '',
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      sha256,
    };
  }

  await fs.promises.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const storedFilename = Date.now() + '-' + safeName;
  const diskPath = path.join(LOCAL_UPLOAD_DIR, storedFilename);
  await fs.promises.writeFile(diskPath, buffer);
  const relativePath = path.relative(process.cwd(), diskPath).split(path.sep).join('/');

  return {
    storageProvider: 'local',
    storageKey: relativePath,
    filePath: diskPath,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    sha256,
  };
}

export async function readStoredFile(document: StoredFileReference): Promise<Buffer> {
  if (document.storageProvider === 'MongoDB') {
    if (!document.storageKey || !mongoose.isValidObjectId(document.storageKey)) {
      throw new Error('Stored document has an invalid MongoDB file reference.');
    }
    const stream = getGridFsBucket().openDownloadStream(new mongoose.mongo.ObjectId(document.storageKey));
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  const filePath = getAbsoluteFilePath(document);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Document file is missing from local storage. Re-upload it to process or download it.');
  }
  return fs.promises.readFile(filePath);
}

export async function computeFileSha256(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) throw new Error('File not found on storage disk');
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function deleteUploadedFile(document: StoredFileReference) {
  if (document.storageProvider === 'MongoDB') {
    if (document.storageKey && mongoose.isValidObjectId(document.storageKey)) {
      await getGridFsBucket().delete(new mongoose.mongo.ObjectId(document.storageKey));
    }
    return;
  }

  const filename = document.storageKey ? path.basename(document.storageKey) : (document.filePath ? path.basename(document.filePath) : '');
  if (!filename) return;
  const targetPath = path.join(LOCAL_UPLOAD_DIR, filename);
  if (fs.existsSync(targetPath)) {
    try {
      await fs.promises.unlink(targetPath);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }
  }
}

export function getAbsoluteFilePath(document: StoredFileReference): string {
  const filename = document.storageKey ? path.basename(document.storageKey) : (document.filePath ? path.basename(document.filePath) : '');
  return filename ? path.join(LOCAL_UPLOAD_DIR, filename) : '';
}
