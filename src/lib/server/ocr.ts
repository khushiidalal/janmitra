import fs from 'fs';
import path from 'path';
import { createWorker, type Worker } from 'tesseract.js';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';

export interface OcrResult {
  rawText: string;
  normalizedText: string;
  charCount: number;
  confidence: number;
  quality: 'High' | 'Medium' | 'Low';
  pageCount: number;
}

const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/gif',
];

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.pdf'];

export function isOcrSupported(mimeType: string, fileName = ''): boolean {
  const normalizedMime = (mimeType || '').toLowerCase();
  if (SUPPORTED_IMAGE_MIMES.includes(normalizedMime) || normalizedMime === 'application/pdf') {
    return true;
  }

  const ext = path.extname(fileName || '').toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}


export async function preprocessImage(input: Buffer | string): Promise<Buffer> {
  const image = sharp(input);
  const metadata = await image.metadata();

  let pipeline = image.rotate(); 

  const width = metadata.width || 0;
  const height = metadata.height || 0;

  
  if (width > 0 && height > 0) {
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    if (minDim < 1200) {
      
      const scale = Math.min(2.5, 1800 / minDim);
      pipeline = pipeline.resize({
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        kernel: sharp.kernel.lanczos3,
      });
    } else if (maxDim > 3200) {
      
      pipeline = pipeline.resize({
        width: width >= height ? 3000 : undefined,
        height: height > width ? 3000 : undefined,
        fit: 'inside',
      });
    }
  }

  
  pipeline = pipeline.grayscale();

  
  try {
    const stats = await pipeline.clone().stats();
    const lum = stats.channels[0];
    const dynamicRange = lum.max - lum.min;

    
    if (dynamicRange < 185) {
      pipeline = pipeline.normalize();
    }
  } catch {
    
    pipeline = pipeline.normalize();
  }

  
  pipeline = pipeline.sharpen({
    sigma: 1.0,
    m1: 1.5,
    m2: 0.7,
  });

  
  return pipeline.png().toBuffer();
}


export function normalizeLegalText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  
  text = text.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ');

  
  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-');

  
  text = text.replace(/(\b[A-Za-z]{2,})-\r?\n([A-Za-z]{2,}\b)/g, '$1$2');

  
  text = text.replace(/\bF\s*I\s*R\s*[-_]\s*(\d{4})\s*[-_]\s*(\d+)\b/gi, 'FIR-$1-$2');

  
  text = text
    .replace(/\bU\s*\/\s*S\b/gi, 'U/S')
    .replace(/\bI\s*\.\s*P\s*\.\s*C\b/gi, 'I.P.C.')
    .replace(/\bC\s*r\s*\.\s*P\s*\.\s*C\b/gi, 'Cr.P.C.')
    .replace(/\bV\s*\/\s*S\b/gi, 'V/S');

  
  const lines = text.split('\n');
  const normalizedLines = lines.map((line) => {
    
    if (/^\[Page \d+\]$/.test(line.trim())) {
      return line.trim();
    }
    return line.replace(/[ \t]+/g, ' ').trim();
  });

  return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}


export function calculateQuality(confidence: number): 'High' | 'Medium' | 'Low' {
  if (confidence >= 80) return 'High';
  if (confidence >= 55) return 'Medium';
  return 'Low';
}


export async function extractTextFromImage(
  input: string | Buffer,
  existingWorker?: Worker
): Promise<{ text: string; confidence: number }> {
  const rawBuffer = typeof input === 'string' ? await fs.promises.readFile(input) : input;

  
  let preprocessedBuffer: Buffer;
  try {
    preprocessedBuffer = await preprocessImage(rawBuffer);
  } catch (prepErr) {
    console.warn('Image preprocessing warning, falling back to raw buffer:', prepErr);
    preprocessedBuffer = rawBuffer;
  }

  const worker = existingWorker || (await createWorker('eng+hin'));
  try {
    const result = await worker.recognize(preprocessedBuffer);
    const text = (result?.data?.text || '').trim();
    const confidence = Math.round(result?.data?.confidence || 0);

    return { text, confidence };
  } finally {
    if (!existingWorker) {
      try {
        await worker.terminate();
      } catch (err) {
        console.warn('Failed to terminate Tesseract worker cleanly:', err);
      }
    }
  }
}


export async function extractTextFromPdf(input: string | Buffer): Promise<{
  rawText: string;
  confidence: number;
  quality: 'High' | 'Medium' | 'Low';
  pageCount: number;
}> {
  const buffer = typeof input === 'string' ? await fs.promises.readFile(input) : input;
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });

    
    let textResult: any = null;
    try {
      textResult = await parser.getText({
        cellSeparator: ' | ',
        lineEnforce: true,
      });
    } catch (parseErr) {
      console.warn('PDF digital text extraction attempt failed:', parseErr);
    }

    const pages = textResult?.pages || [];
    const totalPages = pages.length > 0 ? pages.length : 1;
    const combinedDigitalText = (textResult?.text || '').trim();

    
    if (combinedDigitalText.length >= 30) {
      const pageSections: string[] = [];

      if (pages.length > 1) {
        for (const page of pages) {
          const pageNum = page.num || page.pageNumber || pageSections.length + 1;
          const content = (page.text || '').trim();
          pageSections.push(`[Page ${pageNum}]\n${content}`);
        }
      } else {
        pageSections.push(`[Page 1]\n${combinedDigitalText}`);
      }

      const formattedRawText = pageSections.join('\n\n').trim();

      return {
        rawText: formattedRawText,
        confidence: 100,
        quality: 'High',
        pageCount: totalPages,
      };
    }

    
    try {
      const imageResult = await parser.getImage({ imageBuffer: true });
      const imagePages = imageResult?.pages || [];

      if (imagePages.length > 0) {
        let worker: Worker | null = null;
        const pageTexts: string[] = [];
        const confidences: number[] = [];

        try {
          
          worker = await createWorker('eng+hin');

          for (let pIdx = 0; pIdx < imagePages.length; pIdx++) {
            const page = imagePages[pIdx];
            const pageNum = page.pageNumber || pIdx + 1;
            const pageImages = page.images || [];
            const pageTextParts: string[] = [];

            for (const img of pageImages) {
              if (img && img.data) {
                const imgBuf = Buffer.from(img.data);
                const { text: ocrText, confidence: ocrConf } = await extractTextFromImage(imgBuf, worker);
                if (ocrText) {
                  pageTextParts.push(ocrText);
                  confidences.push(ocrConf);
                }
              }
            }

            const pageBody = pageTextParts.join('\n').trim();
            pageTexts.push(`[Page ${pageNum}]\n${pageBody.length > 0 ? pageBody : '[No readable text on this page]'}`);
          }
        } finally {
          if (worker) {
            try {
              await worker.terminate();
            } catch (wErr) {
              console.warn('Failed to terminate Tesseract worker during PDF scan:', wErr);
            }
          }
        }

        const avgConfidence =
          confidences.length > 0
            ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
            : 0;

        const formattedRaw = pageTexts.join('\n\n').trim();

        return {
          rawText: formattedRaw,
          confidence: avgConfidence,
          quality: calculateQuality(avgConfidence),
          pageCount: imagePages.length,
        };
      }
    } catch (imgErr) {
      console.warn('Scanned PDF image extraction encountered an error:', imgErr);
    }

    
    const fallbackText = combinedDigitalText ? `[Page 1]\n${combinedDigitalText}` : '';
    return {
      rawText: fallbackText,
      confidence: fallbackText ? 60 : 0,
      quality: fallbackText ? 'Medium' : 'Low',
      pageCount: totalPages,
    };
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (dErr) {
        console.warn('Failed to destroy PDF parser:', dErr);
      }
    }
  }
}


export async function processDocumentOcr(
  filePathOrBuffer: string | Buffer,
  mimeType: string,
  fileName = ''
): Promise<OcrResult> {
  const isBuffer = Buffer.isBuffer(filePathOrBuffer);

  if (!isBuffer) {
    const filePath = filePathOrBuffer as string;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('Document file not found on disk storage.');
    }
  }

  const fileSize = isBuffer
    ? (filePathOrBuffer as Buffer).length
    : (await fs.promises.stat(filePathOrBuffer as string)).size;

  if (fileSize === 0) {
    throw new Error('Document file is empty (0 bytes). OCR cannot process an empty file.');
  }

  
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('Document file exceeds the maximum allowed OCR size limit of 25 MB.');
  }

  if (!isOcrSupported(mimeType, fileName)) {
    throw new Error(
      `Unsupported file format for OCR (${mimeType || 'unknown'}). Supported formats include PDF, JPG, JPEG, PNG, WebP, and BMP.`
    );
  }

  const isPdf =
    (mimeType || '').toLowerCase() === 'application/pdf' ||
    (mimeType || '').toLowerCase().includes('pdf') ||
    path.extname(fileName).toLowerCase() === '.pdf';

  let rawText = '';
  let confidence = 0;
  let quality: 'High' | 'Medium' | 'Low' = 'Low';
  let pageCount = 1;

  if (isPdf) {
    const pdfResult = await extractTextFromPdf(filePathOrBuffer);
    rawText = pdfResult.rawText;
    confidence = pdfResult.confidence;
    quality = pdfResult.quality;
    pageCount = pdfResult.pageCount;
  } else {
    const imgResult = await extractTextFromImage(filePathOrBuffer);
    rawText = imgResult.text;
    confidence = imgResult.confidence;
    quality = calculateQuality(confidence);
    pageCount = 1;
  }

  
  const cleanedRawText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const finalRaw = cleanedRawText.length > 0
    ? cleanedRawText
    : 'No readable text could be recognized in this document. The document might be blank, low-resolution, or heavily corrupted.';

  
  const normalizedText = normalizeLegalText(finalRaw);

  return {
    rawText: finalRaw,
    normalizedText,
    charCount: finalRaw.length,
    confidence,
    quality,
    pageCount,
  };
}
