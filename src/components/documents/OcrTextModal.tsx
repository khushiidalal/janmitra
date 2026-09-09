'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Calendar,
  Hash,
  AlertTriangle,
  Layers,
  Sparkles,
  FileCode,
} from 'lucide-react';

interface OcrTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentType?: string;
  ocrText: string;
  normalizedOcrText?: string;
  ocrConfidence?: number | null;
  ocrQuality?: 'High' | 'Medium' | 'Low' | string | null;
  pageCount?: number | null;
  ocrProcessedAt?: string | Date | null;
  sha256?: string;
  onRerunOcr?: () => void;
  isRerunning?: boolean;
  canEdit?: boolean;
}

export default function OcrTextModal({
  isOpen,
  onClose,
  documentName,
  documentType,
  ocrText,
  normalizedOcrText,
  ocrConfidence,
  ocrQuality,
  pageCount,
  ocrProcessedAt,
  sha256,
  onRerunOcr,
  isRerunning = false,
  canEdit = false,
}: OcrTextModalProps) {
  const [viewMode, setViewMode] = useState<'normalized' | 'raw'>(
    normalizedOcrText && normalizedOcrText !== ocrText ? 'normalized' : 'raw'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDisplayText = viewMode === 'normalized' && normalizedOcrText ? normalizedOcrText : ocrText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDisplayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([currentDisplayText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const modeSuffix = viewMode === 'normalized' ? 'normalized' : 'raw';
    element.download = `${documentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${modeSuffix}_ocr.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formattedDate = ocrProcessedAt
    ? new Date(ocrProcessedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  const wordCount = currentDisplayText.trim() ? currentDisplayText.trim().split(/\s+/).length : 0;
  const charCount = currentDisplayText.length;

  // Extract pages for quick navigation
  const pageMatches = Array.from(currentDisplayText.matchAll(/\[Page (\d+)\]/g));
  const detectedPages = pageMatches.map((m) => parseInt(m[1], 10));

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`page-anchor-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Determine quality color and text
  const quality = ocrQuality || (ocrConfidence ? (ocrConfidence >= 80 ? 'High' : ocrConfidence >= 55 ? 'Medium' : 'Low') : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocr-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ocr-modal-title" className="text-lg font-bold text-slate-900">
                  Extracted Document Text
                </h2>

                {/* Quality & Confidence Badge */}
                {quality && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      quality === 'High'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : quality === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        quality === 'High' ? 'bg-emerald-500' : quality === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                    Quality: {quality}
                    {typeof ocrConfidence === 'number' && ocrConfidence > 0 ? ` (${ocrConfidence}%)` : ''}
                  </span>
                )}

                {pageCount && pageCount > 1 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    <Layers className="h-3 w-3" />
                    {pageCount} Pages
                  </span>
                ) : null}
              </div>

              <p className="truncate text-xs font-medium text-slate-500 mt-0.5">
                {documentName} {documentType ? `• ${documentType}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Low Confidence Alert Banner */}
        {quality === 'Low' && (
          <div className="flex items-center gap-2.5 border-b border-rose-100 bg-rose-50/90 px-6 py-2.5 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              <strong>Low Confidence OCR:</strong> The scan quality or lighting is low. Please cross-verify critical numbers, dates, and names against the original evidence.
            </span>
          </div>
        )}

        {/* View Switcher & Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-xs text-slate-600">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('normalized')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                viewMode === 'normalized'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Cleaned & Formatted
            </button>

            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                viewMode === 'raw'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-slate-500" />
              Raw OCR Output
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Processed: {formattedDate}
              </span>
            )}

            <span>
              {wordCount.toLocaleString()} words • {charCount.toLocaleString()} chars
            </span>

            {sha256 && (
              <span
                className="flex items-center gap-1 font-mono text-[11px] text-slate-400"
                title={`Original Evidence SHA-256: ${sha256}`}
              >
                <Hash className="h-3 w-3" />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">SHA-256: {sha256.slice(0, 10)}...</span>
              </span>
            )}
          </div>
        </div>

        {/* Page Jump Navigator for Multi-page Documents */}
        {detectedPages.length > 1 && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-6 py-2 text-xs">
            <span className="font-semibold text-slate-500">Jump to Page:</span>
            <div className="flex flex-wrap gap-1">
              {detectedPages.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => scrollToPage(num)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                >
                  Page {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            {currentDisplayText ? (
              <div className="space-y-4 font-mono text-sm leading-relaxed text-slate-800 selection:bg-blue-100 selection:text-blue-900">
                {currentDisplayText.split('\n\n').map((paragraph, pIdx) => {
                  const pageMatch = paragraph.match(/^\[Page (\d+)\]/);
                  if (pageMatch) {
                    const pageNum = pageMatch[1];
                    const restOfText = paragraph.replace(/^\[Page \d+\]\n?/, '');
                    return (
                      <div key={pIdx} id={`page-anchor-${pageNum}`} className="pt-2">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                          <Layers className="h-3 w-3 text-slate-500" />
                          PAGE {pageNum}
                        </div>
                        <p className="whitespace-pre-wrap">{restOfText}</p>
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 italic">
                No text recognized for this document.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-2">
            {canEdit && onRerunOcr && (
              <button
                type="button"
                onClick={onRerunOcr}
                disabled={isRerunning}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRerunning ? 'Re-running OCR...' : 'Re-run OCR'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download .TXT ({viewMode === 'normalized' ? 'Clean' : 'Raw'})
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shadow-2xs transition ${
                copied
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Text
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

