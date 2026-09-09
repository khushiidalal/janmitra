'use client';

import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  X,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Card from '@/components/ui/Card';

import {
  getCases,
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from '@/lib/api';

export default function Documents() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState('');

  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('FIR');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --------------------------------------------------
  // LOAD CASES + DOCUMENTS
  // --------------------------------------------------

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [casesData, documentsData] = await Promise.all([
        getCases(),
        getDocuments(),
      ]);

      setCases(Array.isArray(casesData) ? casesData : []);

      if (Array.isArray(documentsData)) {
        setDocuments(documentsData);
      } else if (
        documentsData &&
        Array.isArray(documentsData.documents)
      ) {
        setDocuments(documentsData.documents);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // FILE SELECT
  // --------------------------------------------------

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);

    if (file && !documentName) {
      setDocumentName(file.name);
    }

    setError('');
    setSuccess('');
  };

  // --------------------------------------------------
  // UPLOAD
  // --------------------------------------------------

  const handleUpload = async () => {
    setError('');
    setSuccess('');

    if (!selectedCase) {
      setError('Please select a case.');
      return;
    }

    if (!documentName.trim()) {
      setError('Please enter a document name.');
      return;
    }

    if (!selectedFile) {
      setError('Please choose a file.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError('File size must be 10 MB or less.');
      return;
    }

    try {
      setUploading(true);

      await uploadDocument(
        selectedCase,
        documentName.trim(),
        documentType,
        description.trim(),
        selectedFile
      );

      setSuccess('Document uploaded successfully.');

      setDocumentName('');
      setDocumentType('FIR');
      setDescription('');
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this document?'
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteDocument(id);

      setDocuments((prev) =>
        prev.filter(
          (document) =>
            document._id !== id && document.id !== id
        )
      );

      setSuccess('Document deleted successfully.');
    } catch (err: any) {
      setError(err?.message || 'Unable to delete document.');
    }
  };

  // --------------------------------------------------
  // DOWNLOAD
  // --------------------------------------------------

  const handleDownload = async (id: string, name: string) => {
    setError('');

    try {
      const blob = await downloadDocument(id);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = name || 'document';

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Unable to download document.');
    }
  };

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredDocuments = documents.filter((document) => {
    const query = search.toLowerCase();

    return (
      String(
        document.name ||
          document.documentName ||
          ''
      )
        .toLowerCase()
        .includes(query) ||
      String(
        document.documentType ||
          document.type ||
          ''
      )
        .toLowerCase()
        .includes(query) ||
      String(document.caseId || '')
        .toLowerCase()
        .includes(query)
    );
  });

  // --------------------------------------------------
  // CASE NAME
  // --------------------------------------------------

  const getCaseName = (caseId: string) => {
    const foundCase = cases.find(
      (caseItem: any) =>
        String(
          caseItem.id || caseItem._id
        ) === String(caseId)
    );

    if (!foundCase) return caseId || 'Unknown Case';

    return (
      foundCase.id ||
      foundCase.caseId ||
      foundCase._id ||
      'Unknown Case'
    );
  };

  // --------------------------------------------------
  // FORMAT FILE SIZE
  // --------------------------------------------------

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '—';

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Document Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Upload, manage and access case documents securely.
          </p>
        </div>

        <button
          onClick={() => router.push('/cases')}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Cases
        </button>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{success}</span>

          <button onClick={() => setSuccess('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* UPLOAD */}

      <Card className="rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Upload Document
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Attach a document to the correct case.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* CASE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Case
            </label>

            <select
              value={selectedCase}
              onChange={(e) =>
                setSelectedCase(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Case</option>

              {cases.map((caseItem: any) => {
                const caseId =
                  caseItem.id ||
                  caseItem.caseId ||
                  caseItem._id;

                return (
                  <option key={caseId} value={caseId}>
                    {caseId} -{' '}
                    {caseItem.title || 'Untitled Case'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* DOCUMENT NAME */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Document Name
            </label>

            <input
              type="text"
              value={documentName}
              onChange={(e) =>
                setDocumentName(e.target.value)
              }
              placeholder="e.g. FIR Copy"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* TYPE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Document Type
            </label>

            <select
              value={documentType}
              onChange={(e) =>
                setDocumentType(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="FIR">FIR</option>

              <option value="Investigation Report">
                Investigation Report
              </option>

              <option value="Witness Statement">
                Witness Statement
              </option>

              <option value="Evidence">
                Evidence
              </option>

              <option value="Court Order">
                Court Order
              </option>

              <option value="Final Report">
                Final Report
              </option>
            </select>
          </div>

          {/* FILE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              File
            </label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"
            />

            <p className="mt-1 text-[11px] text-slate-400">
              Maximum file size: 10 MB
            </p>
          </div>

          {/* DESCRIPTION */}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={3}
              placeholder="Short description of the document"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* UPLOAD BUTTON */}

        <div className="mt-5">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />

            {uploading
              ? 'Uploading...'
              : 'Upload Document'}
          </button>
        </div>
      </Card>

      {/* DOCUMENT LIST */}

      <Card className="overflow-hidden rounded-xl border border-slate-200 p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Documents
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {documents.length} document
              {documents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search documents..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No documents found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Upload a document to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map(
              (document: any, index: number) => {
                const documentId =
                  document._id || document.id;

                const name =
                  document.name ||
                  document.documentName ||
                  'Untitled Document';

                const type =
                  document.documentType ||
                  document.type ||
                  'Document';

                const caseId =
                  document.caseId ||
                  document.case ||
                  '';

                const size =
                  document.fileSize ||
                  document.size ||
                  document.file?.size ||
                  0;

                return (
                  <div
                    key={documentId || index}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 md:flex-row md:items-center"
                  >
                    {/* ICON */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>{type}</span>

                        <span>
                          Case: {getCaseName(caseId)}
                        </span>

                        {size ? (
                          <span>
                            {formatFileSize(
                              Number(size)
                            )}
                          </span>
                        ) : null}
                      </div>

                      {document.description && (
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {document.description}
                        </p>
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() =>
                          handleDownload(
                            documentId,
                            name
                          )
                        }
                        className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(documentId)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
