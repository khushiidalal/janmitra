/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongoose', 'pdf-parse', 'pdfjs-dist', 'tesseract.js', 'sharp'],
};

export default nextConfig;
