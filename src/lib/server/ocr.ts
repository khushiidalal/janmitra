import fs from 'fs';
import path from 'path';
import { createWorker, PSM, type Worker } from 'tesseract.js';
import { CanvasFactory } from 'pdf-parse/worker';
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
const LANGUAGE_DATA_DIR = path.join(process.cwd(), 'ocr-data');

async function createOcrWorker(): Promise<Worker> {
  const hasLocalLanguageData = ['eng', 'hin'].every((lang) =>
    fs.existsSync(path.join(LANGUAGE_DATA_DIR, lang + '.traineddata'))
  );
  return createWorker(
    ['eng', 'hin'],
    1,
    hasLocalLanguageData ? { langPath: LANGUAGE_DATA_DIR, gzip: false } : {}
  );
}

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

  // Auto-rotate based on EXIF orientation
  let pipeline = image.rotate();

  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width > 0 && height > 0) {
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    if (minDim < 1500) {
      // Upscale small/low-res images for better OCR — target ~2200px on short side
      const scale = Math.min(3.0, 2200 / minDim);
      pipeline = pipeline.resize({
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        kernel: sharp.kernel.lanczos3,
      });
    } else if (maxDim > 4000) {
      // Downscale very large images to avoid memory issues
      pipeline = pipeline.resize({
        width: width >= height ? 3500 : undefined,
        height: height > width ? 3500 : undefined,
        fit: 'inside',
      });
    }
  }

  // Convert to grayscale
  pipeline = pipeline.grayscale();

  // Median filter to reduce salt-and-pepper noise from hardcopy scans
  try {
    pipeline = (pipeline as any).median(1);
  } catch {
    // median may not be available in all sharp builds — skip silently
  }

  // Adaptive normalization based on dynamic range
  try {
    const stats = await pipeline.clone().stats();
    const lum = stats.channels[0];
    const dynamicRange = lum.max - lum.min;

    if (dynamicRange < 200) {
      pipeline = pipeline.normalize();
    }
  } catch {
    pipeline = pipeline.normalize();
  }

  // CLAHE — improves local contrast for uneven lighting on hardcopies
  try {
    pipeline = (pipeline as any).clahe({ width: 64, height: 64, maxSlope: 3 });
  } catch {
    // CLAHE may not be available in all sharp versions — skip silently
  }

  // Sharpen to enhance ink edges
  pipeline = pipeline.sharpen({
    sigma: 1.2,
    m1: 2.0,
    m2: 0.5,
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
    .replace(/\|\.P\.C\b/gi, 'I.P.C.')
    .replace(/\bU\s*\/\s*S\b/gi, 'U/S')
    .replace(/\bI\s*\.\s*P\s*\.\s*C\b/gi, 'I.P.C.')
    .replace(/\bC\s*r\s*\.\s*P\s*\.\s*C\b/gi, 'Cr.P.C.')
    .replace(/\bV\s*\/\s*S\b/gi, 'V/S');

  // Fix double-period artefact (e.g. "Cr.P.C.." → "Cr.P.C.")
  text = text.replace(/([A-Z]\.)\.+/g, '$1');

  // Strip isolated single noise characters on their own line (OCR artefacts)
  text = text.replace(/^[^A-Za-z0-9\u0900-\u097F]{1,2}$/gm, '');

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

  // Preprocess for OCR (upscale, denoise, CLAHE, sharpen)
  let preprocessedBuffer: Buffer;
  try {
    preprocessedBuffer = await preprocessImage(rawBuffer);
  } catch (prepErr) {
    console.warn('Image preprocessing warning, falling back to raw buffer:', prepErr);
    preprocessedBuffer = rawBuffer;
  }

  const worker = existingWorker || await createOcrWorker();

  const recognizeBuffer = async (buf: Buffer) => {
    const result = await worker.recognize(buf);
    const text = (result?.data?.text || '').trim();
    const confidence = Math.round(result?.data?.confidence || 0);
    return { text, confidence };
  };

  try {
    const first = await recognizeBuffer(preprocessedBuffer);

    // Sparse-text segmentation can recover forms, stamps, and uneven layouts
    // that the default segmentation misses. Keep the first pass unless better.
    let best = first;
    if (first.confidence < 75) {
      try {
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
        const sparseLayout = await recognizeBuffer(preprocessedBuffer);
        if (sparseLayout.confidence > best.confidence) best = sparseLayout;
      } catch (passErr) {
        console.warn('Alternate OCR segmentation pass failed:', passErr);
      } finally {
        try {
          await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
        } catch {
          // Keep the primary result if the worker cannot reset its mode.
        }
      }
    }

    // Multi-pass orientation recovery for low-confidence results
    if (best.confidence < 35) {
      const rotations = [90, 270] as const;

      for (const deg of rotations) {
        try {
          const rotated = await sharp(preprocessedBuffer).rotate(deg).png().toBuffer();
          const attempt = await recognizeBuffer(rotated);
          if (attempt.confidence > best.confidence) {
            best = attempt;
          }
        } catch {
          // Skip rotation attempt if it fails
        }
      }

      return best;
    }

    return first;
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
    parser = new PDFParse({ data: buffer, CanvasFactory });

    
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

    // Fall through to OCR: use getScreenshot() which renders each page as PNG
    // (getImage() returns 0 images for text-based / most scanned PDFs)
    try {
      const screenshotResult = await (parser as any).getScreenshot({ imageBuffer: true, scale: 2.0 });
      const screenshotPages = screenshotResult?.pages || [];

      if (screenshotPages.length > 0) {
        let worker: Worker | null = null;
        const pageTexts: string[] = [];
        const confidences: number[] = [];

        try {
          worker = await createOcrWorker();

          for (let pIdx = 0; pIdx < screenshotPages.length; pIdx++) {
            const page = screenshotPages[pIdx];
            const pageNum = page.pageNumber || pIdx + 1;

            // getScreenshot returns page.data as the PNG Buffer
            const pageBuffer = page.data ? Buffer.from(page.data) : null;
            if (!pageBuffer || pageBuffer.length === 0) {
              pageTexts.push(`[Page ${pageNum}]\n[No image data for this page]`);
              continue;
            }

            const { text: ocrText, confidence: ocrConf } = await extractTextFromImage(pageBuffer, worker);
            pageTexts.push(`[Page ${pageNum}]\n${ocrText.length > 0 ? ocrText : '[No readable text on this page]'}`);
            if (ocrConf > 0) confidences.push(ocrConf);
          }
        } finally {
          if (worker) {
            try {
              await worker.terminate();
            } catch (wErr) {
              console.warn('Failed to terminate Tesseract worker during PDF OCR:', wErr);
            }
          }
        }

        const avgConfidence =
          confidences.length > 0
            ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
            : 0;

        return {
          rawText: pageTexts.join('\n\n').trim(),
          confidence: avgConfidence,
          quality: calculateQuality(avgConfidence),
          pageCount: screenshotPages.length,
        };
      }
    } catch (screenshotErr) {
      console.warn('PDF screenshot OCR encountered an error, using fallback:', screenshotErr);
    }

    // Last-resort fallback: return whatever digital text we got
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
        await (parser as any).destroy();
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
