
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongoose', 'pdf-parse', 'pdfjs-dist', 'tesseract.js', 'sharp'],
  outputFileTracingIncludes: {
    '/api/documents/[id]/ocr': ['./ocr-data/*.traineddata'],
    '/api/cases/[id]/documents/[docId]/ocr': ['./ocr-data/*.traineddata'],
  },
};

export default nextConfig;
