import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
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

let isWorkerConfigured = false;

/**
 * Ensures PDFParse has the absolute worker URL configured in Node.js / Next.js environments
 * so it never attempts to dynamically import a missing relative worker file in server chunks.
 */
function ensurePdfWorkerConfigured(): void {
  if (isWorkerConfigured) return;
  try {
    const cwd = process.cwd();
    const candidatePaths = [
      path.join(cwd, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs'),
      path.join(cwd, 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'esm', 'pdf.worker.mjs'),
      path.join(cwd, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
      path.join(cwd, 'node_modules', 'pdf-parse', 'dist', 'worker', 'pdf.worker.mjs'),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
        const fileUrl = pathToFileURL(candidate).href;
        PDFParse.setWorker(fileUrl);
        isWorkerConfigured = true;

        // Also copy into .next chunks directories if they exist as a safety net
        const targetDirs = [
          path.join(cwd, '.next', 'dev', 'server', 'chunks'),
          path.join(cwd, '.next', 'server', 'chunks'),
        ];
        for (const dir of targetDirs) {
          try {
            if (fs.existsSync(/*turbopackIgnore: true*/ dir)) {
              const dest = path.join(dir, 'pdf.worker.mjs');
              if (!fs.existsSync(/*turbopackIgnore: true*/ dest)) {
                fs.copyFileSync(candidate, dest);
              }
            }
          } catch {}
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Could not set custom PDF worker path:', err);
  }
}

/**
 * Check whether a document's MIME type or file extension is supported by the OCR engine.
 */
export function isOcrSupported(mimeType: string, fileName = ''): boolean {
  const normalizedMime = (mimeType || '').toLowerCase();
  if (SUPPORTED_IMAGE_MIMES.includes(normalizedMime) || normalizedMime === 'application/pdf') {
    return true;
  }

  const ext = path.extname(fileName || '').toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Adaptive image preprocessing pipeline using Sharp.
 * Inspects image characteristics and applies selective enhancements:
 * - Auto-rotation from EXIF metadata (crucial for smartphone camera captures)
 * - Intelligent scaling: Upscales low-resolution scans (< 1200px) with Lanczos3 to reach ~300 DPI text stroke height
 * - Downscales overly massive images (> 3200px) to prevent server memory bloat
 * - Grayscale conversion to eliminate chromatic aberration and colored paper noise
 * - Dynamic contrast enhancement (histogram stretching) when luminance contrast is poor
 * - Unsharp mask sharpening to define text contours without introducing noise halos
 */
export async function preprocessImage(input: Buffer | string): Promise<Buffer> {
  const image = sharp(input);
  const metadata = await image.metadata();

  let pipeline = image.rotate(); // Auto-rotate based on EXIF orientation tag

  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Resolution handling
  if (width > 0 && height > 0) {
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    if (minDim < 1200) {
      // Low-resolution document scan: upscale to achieve optimal ~30-35px x-height for Tesseract
      const scale = Math.min(2.5, 1800 / minDim);
      pipeline = pipeline.resize({
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        kernel: sharp.kernel.lanczos3,
      });
    } else if (maxDim > 3200) {
      // Overly large document image: limit to 3000px max dimension
      pipeline = pipeline.resize({
        width: width >= height ? 3000 : undefined,
        height: height > width ? 3000 : undefined,
        fit: 'inside',
      });
    }
  }

  // Convert to grayscale
  pipeline = pipeline.grayscale();

  // Analyze contrast range
  try {
    const stats = await pipeline.clone().stats();
    const lum = stats.channels[0];
    const dynamicRange = lum.max - lum.min;

    // If dynamic range is compressed (< 185) e.g. scanner haze or dark photograph, stretch histogram
    if (dynamicRange < 185) {
      pipeline = pipeline.normalize();
    }
  } catch {
    // If stats analysis fails on exotic formats, fall back to standard normalize
    pipeline = pipeline.normalize();
  }

  // Subtle unsharp masking to enhance stroke definition
  pipeline = pipeline.sharpen({
    sigma: 1.0,
    m1: 1.5,
    m2: 0.7,
  });

  // Return lossless PNG buffer for Tesseract input
  return pipeline.png().toBuffer();
}

/**
 * Non-destructive legal text normalization.
 * Fixes common scanning and line-break artifacts without altering underlying words or numbers:
 * - Dehyphenates broken words across line endings (e.g. "inves-\ntigation" -> "investigation")
 * - Standardizes spaced FIR and Case IDs (e.g. "F I R - 2026 - 013" -> "FIR-2026-013")
 * - Standardizes Under Section / legal acronym spacing (e.g. "U / S" -> "U/S", "I . P . C" -> "I.P.C.")
 * - Replaces non-breaking spaces and smart quotes with standard Unicode characters
 * - Normalizes redundant inline spaces while strictly preserving line breaks and page markers
 * - Never guesses or modifies ambiguous names, addresses, or dates
 */
export function normalizeLegalText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Replace Unicode non-breaking whitespace and zero-width spaces with standard space
  text = text.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ');

  // Standardize smart / curly quotes and dashes
  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-');

  // Dehyphenate words broken across line wraps (e.g. "infor-\nmation" -> "information")
  text = text.replace(/(\b[A-Za-z]{2,})-\r?\n([A-Za-z]{2,}\b)/g, '$1$2');

  // Standardize spaced FIR IDs (e.g. "F I R - 2026 - 013" -> "FIR-2026-013")
  text = text.replace(/\bF\s*I\s*R\s*[-_]\s*(\d{4})\s*[-_]\s*(\d+)\b/gi, 'FIR-$1-$2');

  // Standardize common Indian legal notation spacings
  text = text
    .replace(/\bU\s*\/\s*S\b/gi, 'U/S')
    .replace(/\bI\s*\.\s*P\s*\.\s*C\b/gi, 'I.P.C.')
    .replace(/\bC\s*r\s*\.\s*P\s*\.\s*C\b/gi, 'Cr.P.C.')
    .replace(/\bV\s*\/\s*S\b/gi, 'V/S');

  // Clean lines: trim trailing spaces on each line, collapse multiple spaces into single space
  const lines = text.split('\n');
  const normalizedLines = lines.map((line) => {
    // If it's a page delimiter, keep intact
    if (/^\[Page \d+\]$/.test(line.trim())) {
      return line.trim();
    }
    return line.replace(/[ \t]+/g, ' ').trim();
  });

  return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Calculates a human-readable quality rating from a 0-100 confidence score.
 */
export function calculateQuality(confidence: number): 'High' | 'Medium' | 'Low' {
  if (confidence >= 80) return 'High';
  if (confidence >= 55) return 'Medium';
  return 'Low';
}

/**
 * Extracts text and confidence from an image buffer or file path using Tesseract.js
 * with bilingual English + Hindi ('eng+hin') models and adaptive preprocessing.
 */
export async function extractTextFromImage(
  input: string | Buffer,
  existingWorker?: Worker
): Promise<{ text: string; confidence: number }> {
  const rawBuffer = typeof input === 'string' ? await fs.promises.readFile(input) : input;

  // Apply adaptive preprocessing (DPI upscaling, contrast normalization, sharpening)
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

/**
 * Extracts text from a PDF buffer or file path.
 * 1. Checks whether the PDF contains an embedded text layer using layout-aware parameters
 *    (cellSeparator: ' | ', lineEnforce: true).
 * 2. If a usable text layer exists, extracts it directly with 100% confidence, preserving page boundaries.
 * 3. If scanned / image-only, extracts page images, applies adaptive preprocessing, and runs OCR
 *    using a single reusable bilingual ('eng+hin') worker across all pages.
 */
export async function extractTextFromPdf(input: string | Buffer): Promise<{
  rawText: string;
  confidence: number;
  quality: 'High' | 'Medium' | 'Low';
  pageCount: number;
}> {
  const buffer = typeof input === 'string' ? await fs.promises.readFile(input) : input;
  ensurePdfWorkerConfigured();

  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });

    // Stage 1: Attempt digital text extraction with layout and table preservation
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

    // Check if substantial digital text exists (more than 30 characters across the document)
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

    // Stage 2: Scanned PDF fallback - extract page images and run bilingual OCR
    try {
      const imageResult = await parser.getImage({ imageBuffer: true });
      const imagePages = imageResult?.pages || [];

      if (imagePages.length > 0) {
        let worker: Worker | null = null;
        const pageTexts: string[] = [];
        const confidences: number[] = [];

        try {
          // Reusable worker across all pages of the document
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

    // Fallback: Return whatever digital text was found, even if under 30 characters
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

/**
 * Main OCR orchestrator for a document.
 * Reads the original file, verifies integrity boundaries, executes adaptive preprocessing
 * and bilingual recognition, and returns structured raw + normalized text with confidence scores.
 */
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

  // Maximum file size limit: 25 MB to protect server resources
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

  // Clean raw text formatting while preserving evidence verbatim
  const cleanedRawText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const finalRaw = cleanedRawText.length > 0
    ? cleanedRawText
    : 'No readable text could be recognized in this document. The document might be blank, low-resolution, or heavily corrupted.';

  // Produce normalized text layer without altering raw evidence
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
