
const nextConfig = {
  reactStrictMode: true,
  experimental: { authInterrupts: true },
  serverExternalPackages: ['mongoose', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', 'tesseract.js', 'sharp'],
  outputFileTracingIncludes: {
    '/api/documents/[id]/ocr': ['./ocr-data/*.traineddata', './node_modules/@napi-rs/canvas/**/*'],
    '/api/cases/[id]/documents/[docId]/ocr': ['./ocr-data/*.traineddata', './node_modules/@napi-rs/canvas/**/*'],
  },
};

export default nextConfig;
