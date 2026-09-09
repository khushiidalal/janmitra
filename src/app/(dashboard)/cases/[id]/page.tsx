'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  getCase,
  updateCase,
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '@/lib/api';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function CaseDetail() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();

  const [caseItem, setCaseItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ---------- Documents ----------
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('FIR');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [documentSearch, setDocumentSearch] = useState('');
  const [documentFilter, setDocumentFilter] = useState('');

  // ---------- Load Case ----------
  useEffect(() => {
    let active = true;

    if (!id) {
      setCaseItem(null);
      setLoading(false);
      return;
    }

    const fetchCase = async () => {
      setLoading(true);

      try {
        const data = await getCase(id);

        if (active) {
          setCaseItem(data);
        }
      } catch (error) {
        console.error('Failed to load case:', error);

        if (active) {
          setCaseItem(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCase();

    return () => {
      active = false;
    };
  }, [id]);

  // ---------- Load Documents ----------
  const loadDocuments = async () => {
    if (!id) return;

    setDocumentsLoading(true);

    try {
      const data = await getDocuments(id);

      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (
        data &&
        Array.isArray(data.documents)
      ) {
        setDocuments(data.documents);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [id]);

  // ---------- Filter Documents ----------
  const filteredDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();

    return documents.filter((doc: any) => {
      const name = String(
        doc?.name ||
          doc?.documentName ||
          doc?.fileName ||
          ''
      ).toLowerCase();

      const type = String(
        doc?.documentType ||
          doc?.type ||
          ''
      ).toLowerCase();

      const description = String(
        doc?.description || ''
      ).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        type.includes(query) ||
        description.includes(query);

      const documentTypeValue = String(
        doc?.documentType ||
          doc?.type ||
          ''
      );

      const matchesFilter =
        !documentFilter ||
        documentTypeValue.toLowerCase() ===
          documentFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [documents, documentSearch, documentFilter]);

  // ---------- Upload Document ----------
  const handleDocumentUpload = async () => {
    if (!id) {
      alert('Case ID is missing.');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file.');
      return;
    }

    if (!documentName.trim()) {
      alert('Please enter document name.');
      return;
    }

    // Frontend file size validation
    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      alert('File size must be 10 MB or less.');
      return;
    }

    setUploading(true);

    try {
      await uploadDocument(
        id,
        documentName.trim(),
        documentType,
        documentDescription.trim(),
        selectedFile
      );

      alert('Document uploaded successfully.');

      setDocumentName('');
      setDocumentType('FIR');
      setDocumentDescription('');
      setSelectedFile(null);

      const fileInput = document.getElementById(
        'document-file'
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = '';
      }

      await loadDocuments();
    } catch (error: any) {
      console.error('Document upload error:', error);

      alert(
        error?.message ||
          'Failed to upload document.'
      );
    } finally {
      setUploading(false);
    }
  };

  // ---------- Download Document ----------
  const handleDocumentDownload = async (
    documentId: string,
    fileName?: string
  ) => {
    if (!documentId) {
      alert('Document ID is missing.');
      return;
    }

    try {
      const blob = await downloadDocument(documentId);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;
      link.download = fileName || 'document';

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);

      alert(
        error?.message ||
          'Failed to download document.'
      );
    }
  };

  // ---------- Delete Document ----------
  const handleDocumentDelete = async (
    documentId: string
  ) => {
    if (!documentId) {
      alert('Document ID is missing.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this document?'
    );

    if (!confirmed) return;

    try {
      await deleteDocument(documentId);

      setDocuments((prev) =>
        prev.filter(
          (document) =>
            document._id !== documentId &&
            document.id !== documentId
        )
      );

      alert('Document deleted successfully.');
    } catch (error: any) {
      console.error(
        'Delete document error:',
        error
      );

      alert(
        error?.message ||
          'Failed to delete document.'
      );
    }
  };

  // ---------- Case Status ----------
  const handleStatusChange = async (
    status: string
  ) => {
    if (!id) return;

    setUpdating(true);

    try {
      const updated = await updateCase(id, {
        status,
      });

      setCaseItem(
        updated?.case ||
          updated?.data ||
          updated
      );
    } catch (error) {
      console.error(
        'Failed to update case status:',
        error
      );

      alert('Failed to update case status.');
    } finally {
      setUpdating(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading case...
      </div>
    );
  }

  // ---------- Case Not Found ----------
  if (!caseItem) {
    return (
      <div className="space-y-4 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Case not found
        </h2>

        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-600 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const caseId =
    caseItem.id ||
    caseItem.caseId ||
    caseItem._id ||
    id;

  const caseTitle =
    caseItem.title ||
    'Untitled Case';

  const caseStatus =
    caseItem.status ||
    'Pending';

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-900"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {/* Case Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {caseId}
          </h1>

          <p className="mt-1 text-lg text-gray-500">
            {caseTitle}
          </p>
        </div>

        <Badge
          status={caseStatus as any}
          className="px-4 py-2 text-sm"
        />
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Left Section */}
        <Card className="space-y-6 p-6 md:col-span-2">

          <h3 className="border-b border-gray-100 pb-2 text-lg font-bold">
            Incident Information
          </h3>

          {/* Incident Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Incident Date
              </p>

              <p className="font-semibold text-gray-900">
                {caseItem.date ||
                  caseItem.incidentDate ||
                  '—'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Status
              </p>

              <p className="font-semibold text-gray-900">
                {caseStatus}
              </p>
            </div>

            {caseItem.category && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Category
                </p>

                <p className="font-semibold text-gray-900">
                  {caseItem.category}
                </p>
              </div>
            )}

            {caseItem.location && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Location
                </p>

                <p className="font-semibold text-gray-900">
                  {caseItem.location}
                </p>
              </div>
            )}

          </div>

          {/* Description */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Description
            </p>

            <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-gray-900">
              {caseItem.description ||
                'No description available for this case.'}
            </p>
          </div>

          {/* People */}
          {Array.isArray(caseItem.people) &&
            caseItem.people.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">
                  People Involved
                </p>

                <div className="space-y-2">
                  {caseItem.people.map(
                    (person: any, index: number) => (
                      <div
                        key={
                          person.id ||
                          person._id ||
                          index
                        }
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
                      >
                        <span className="font-medium text-gray-900">
                          {person.name ||
                            'Unknown Person'}
                        </span>

                        <span className="text-xs text-gray-500">
                          {person.relationship ||
                            person.role ||
                            ''}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Existing Case Documents */}
          {Array.isArray(caseItem.documents) &&
            caseItem.documents.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Documents ({caseItem.documents.length})
                </p>

                <div className="space-y-2">
                  {caseItem.documents.map(
                    (doc: any, index: number) => (
                      <div
                        key={
                          doc.id ||
                          doc._id ||
                          index
                        }
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
                      >
                        <span className="max-w-xs truncate font-medium text-gray-900">
                          {doc.name ||
                            doc.documentName ||
                            doc.fileName ||
                            'Untitled Document'}
                        </span>

                        <span className="text-xs text-gray-500">
                          {doc.type ||
                            doc.documentType ||
                            'Document'}

                          {doc.size
                            ? ` • ${doc.size}`
                            : ''}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* DOCUMENT MANAGEMENT */}
          <div className="space-y-5 border-t border-gray-100 pt-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Document Management
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Upload and manage case documents
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {documents.length} document
                {documents.length !== 1
                  ? 's'
                  : ''}
              </span>
            </div>

            {/* Upload Document */}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

              <h4 className="font-semibold text-gray-900">
                Upload Document
              </h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Document Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Document Name
                  </label>

                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) =>
                      setDocumentName(
                        e.target.value
                      )
                    }
                    placeholder="e.g. FIR Copy"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  />
                </div>

                {/* Document Type */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Document Type
                  </label>

                  <select
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="FIR">
                      FIR
                    </option>

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
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={documentDescription}
                  onChange={(e) =>
                    setDocumentDescription(
                      e.target.value
                    )
                  }
                  placeholder="Short description of the document"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                />
              </div>

              {/* File */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  File
                </label>

                <input
                  id="document-file"
                  type="file"
                  onChange={(e) =>
                    setSelectedFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                  className="w-full text-sm"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Maximum file size: 10 MB
                </p>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={handleDocumentUpload}
                disabled={
                  uploading ||
                  !selectedFile
                }
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? 'Uploading...'
                  : 'Upload Document'}
              </button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col gap-3 md:flex-row">

              <input
                type="text"
                value={documentSearch}
                onChange={(e) =>
                  setDocumentSearch(
                    e.target.value
                  )
                }
                placeholder="Search documents..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />

              <select
                value={documentFilter}
                onChange={(e) =>
                  setDocumentFilter(
                    e.target.value
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="">
                  All Types
                </option>

                <option value="FIR">
                  FIR
                </option>

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

            {/* Documents List */}
            {documentsLoading ? (
              <div className="py-6 text-center text-gray-500">
                Loading documents...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
                <p className="text-gray-500">
                  {documents.length === 0
                    ? 'No documents found for this case.'
                    : 'No documents match your search.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map(
                  (doc: any, index: number) => {
                    const documentId =
                      doc._id ||
                      doc.id;

                    const name =
                      doc.name ||
                      doc.documentName ||
                      doc.fileName ||
                      'Untitled Document';

                    const type =
                      doc.documentType ||
                      doc.type ||
                      'Document';

                    return (
                      <div
                        key={
                          documentId ||
                          index
                        }
                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {type}

                            {doc.fileName &&
                              doc.fileName !==
                                name
                              ? ` • ${doc.fileName}`
                              : ''}
                          </p>

                          {doc.description && (
                            <p className="mt-1 text-xs text-gray-400">
                              {doc.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">

                          {/* Download */}
                          <button
                            type="button"
                            disabled={!documentId}
                            onClick={() =>
                              handleDocumentDownload(
                                documentId,
                                doc.fileName ||
                                  name
                              )
                            }
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            Download
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={!documentId}
                            onClick={() =>
                              handleDocumentDelete(
                                documentId
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
                          </button>

                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="space-y-6 p-6">

          <h3 className="border-b border-gray-100 pb-2 text-lg font-bold">
            Quick Actions
          </h3>

          <button
            onClick={() =>
              handleStatusChange('Active')
            }
            disabled={
              updating ||
              caseStatus === 'Active'
            }
            className="w-full rounded-lg bg-green-50 py-2 font-medium text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating &&
            caseStatus !== 'Active'
              ? 'Updating...'
              : 'Mark as Active'}
          </button>

          <button
            onClick={() => router.push('/documents')}
            className="w-full rounded-lg border border-gray-200 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Manage Documents
          </button>

          <button
            onClick={() =>
              handleStatusChange('Closed')
            }
            disabled={
              updating ||
              caseStatus === 'Closed'
            }
            className="w-full rounded-lg border border-red-200 bg-red-50 py-2 font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating &&
            caseStatus !== 'Closed'
              ? 'Updating...'
              : 'Close Case'}
          </button>

        </Card>
      </div>
    </div>
  );
}
