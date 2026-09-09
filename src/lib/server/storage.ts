import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');

if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

export async function saveUploadedFile(file: File): Promise<{
  storageProvider: 'local';
  storageKey: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedFilename = `${timestamp}-${safeName}`;
  const diskPath = path.join(LOCAL_UPLOAD_DIR, storedFilename);

  await fs.promises.writeFile(diskPath, buffer);

  const relativePath = path.relative(process.cwd(), diskPath).replace(/\\/g, '/');

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

export async function computeFileSha256(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found on storage disk');
  }
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function deleteUploadedFile(document: { storageKey?: string; filePath?: string }) {
  const filename = document.storageKey ? path.basename(document.storageKey) : (document.filePath ? path.basename(document.filePath) : '');
  if (filename) {
    const targetPath = path.join(LOCAL_UPLOAD_DIR, filename);
    if (fs.existsSync(targetPath)) {
      try {
        await fs.promises.unlink(targetPath);
      } catch (e) {
        console.warn('Failed to delete file from disk:', e);
      }
    }
  }
}

export function getAbsoluteFilePath(document: { storageKey?: string; filePath?: string }): string {
  const filename = document.storageKey ? path.basename(document.storageKey) : (document.filePath ? path.basename(document.filePath) : '');
  return filename ? path.join(LOCAL_UPLOAD_DIR, filename) : '';
}
