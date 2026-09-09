/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'tesseract.js', 'sharp'],
};

export default nextConfig;
