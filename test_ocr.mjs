import sharp from 'sharp';
import { PDFParse } from 'pdf-parse';
import { extractTextFromPdf, extractTextFromImage, processDocumentOcr } from './src/lib/server/ocr.ts';

async function run() {
  console.log('Testing current OCR...');
  // 1. Create a hardcopy simulation image
  // Hardcopy simulation: paper background, slightly off-white, serif/printed font, stamp, slight noise
  const svg = `
    <svg width="800" height="900" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f4f1ea"/>
      <rect x="30" y="30" width="740" height="840" fill="none" stroke="#333" stroke-width="2"/>
      <text x="180" y="80" font-family="Times New Roman, serif" font-size="26" font-weight="bold" fill="#111">DELHI POLICE SPECIAL CELL</text>
      <text x="210" y="115" font-family="Times New Roman, serif" font-size="20" font-weight="bold" fill="#222">FIRST INFORMATION REPORT</text>
      <text x="270" y="145" font-family="Arial, sans-serif" font-size="14" fill="#444">(Under Section 154 Cr.P.C.)</text>
      <line x1="50" y1="160" x2="750" y2="160" stroke="#222" stroke-width="1.5"/>
      <text x="60" y="200" font-family="Arial, sans-serif" font-size="16" fill="#111">1. District: New Delhi      P.S.: Parliament Street      Year: 2026</text>
      <text x="60" y="235" font-family="Arial, sans-serif" font-size="16" fill="#111">2. FIR No.: 0089/2026      Date: 28/09/2026</text>
      <text x="60" y="270" font-family="Arial, sans-serif" font-size="16" fill="#111">3. Acts and Sections: Section 420, 468, 471 I.P.C.</text>
      <text x="60" y="310" font-family="Arial, sans-serif" font-size="16" fill="#111">4. Complainant Name: Ramesh Chand Verma</text>
      <text x="60" y="345" font-family="Arial, sans-serif" font-size="16" fill="#111">5. Address: 14/B, Barakhamba Road, Connaught Place, New Delhi</text>
      <text x="60" y="385" font-family="Arial, sans-serif" font-size="16" fill="#111">6. Brief Description: The complainant reported unauthorized debit of Rs. 4,50,000</text>
      <text x="85" y="415" font-family="Arial, sans-serif" font-size="16" fill="#111">from State Bank of India account through fraudulent SIM swapping.</text>
      <circle cx="650" cy="550" r="60" fill="none" stroke="#8b0000" stroke-width="3" stroke-dasharray="4,2"/>
      <text x="605" y="545" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#8b0000">OFFICIAL SEAL</text>
      <text x="612" y="565" font-family="Arial, sans-serif" font-size="12" fill="#8b0000">POLICE DEPT</text>
    </svg>
  `;

  const imgBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  console.log('Created simulated hardcopy scan image, buffer size:', imgBuffer.length);

  console.log('\n--- Test 1: processDocumentOcr on simulated hardcopy image ---');
  try {
    const res = await processDocumentOcr(imgBuffer, 'image/png', 'fir_hardcopy.png');
    console.log('Result quality:', res.quality);
    console.log('Result confidence:', res.confidence);
    console.log('Result text:\n', res.rawText);
    console.log('Normalized text:\n', res.normalizedText);
  } catch (err) {
    console.error('Test 1 failed:', err);
  }
}

run().catch(console.error);
