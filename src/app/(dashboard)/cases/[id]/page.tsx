"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getCase,
  updateCase,
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  runDocumentOCR,
  runCaseDocumentOCR,
  getMe,
} from "@/lib/api";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import OcrTextModal from "@/components/documents/OcrTextModal";

export default function CaseDetail() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();

  const [caseItem, setCaseItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrRunningId, setOcrRunningId] = useState<string | null>(null);
  const [activeOcrDoc, setActiveOcrDoc] = useState<any | null>(null);

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("FIR");
  const [documentDescription, setDocumentDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [documentSearch, setDocumentSearch] = useState("");
  const [documentFilter, setDocumentFilter] = useState("");

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.role) {
          setCurrentUserRole(parsedUser.role);
        }
      }
    } catch {
      
    }

    getMe()
      .then((user) => {
        if (user?.role) {
          setCurrentUserRole(user.role);
          try {
            localStorage.setItem("user", JSON.stringify(user));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const canEditCase =
    !currentUserRole ||
    [
      "Admin",
      "Senior Officer",
      "Investigator",
      "Officer",
      "Clerk",
    ].includes(currentUserRole || "");

  
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
        console.error("Failed to load case:", error);

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

  
  const loadDocuments = async () => {
    if (!id) return;

    setDocumentsLoading(true);

    try {
      const data = await getDocuments(id);

      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (data && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [id]);

  
  const filteredDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();

    return documents.filter((doc: any) => {
      const name = String(
        doc?.name || doc?.documentName || doc?.fileName || "",
      ).toLowerCase();

      const type = String(doc?.documentType || doc?.type || "").toLowerCase();

      const description = String(doc?.description || "").toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        type.includes(query) ||
        description.includes(query);

      const documentTypeValue = String(doc?.documentType || doc?.type || "");

      const matchesFilter =
        !documentFilter ||
        documentTypeValue.toLowerCase() === documentFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [documents, documentSearch, documentFilter]);

  
  const handleDocumentUpload = async () => {
    if (!id) {
      alert("Case ID is missing.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    if (!documentName.trim()) {
      alert("Please enter document name.");
      return;
    }

    
    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      alert("File size must be 10 MB or less.");
      return;
    }

    setUploading(true);

    try {
      await uploadDocument(
        id,
        documentName.trim(),
        documentType,
        documentDescription.trim(),
        selectedFile,
      );

      alert("Document uploaded successfully.");

      setDocumentName("");
      setDocumentType("FIR");
      setDocumentDescription("");
      setSelectedFile(null);

      const fileInput = document.getElementById(
        "document-file",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();
    } catch (error: any) {
      console.error("Document upload error:", error);

      alert(error?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  
  const handleDocumentDownload = async (
    documentId: string,
    fileName?: string,
  ) => {
    if (!documentId) {
      alert("Document ID is missing.");
      return;
    }

    try {
      const blob = await downloadDocument(documentId);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || "document";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download error:", error);

      alert(error?.message || "Failed to download document.");
    }
  };

  
  const handleDocumentDelete = async (documentId: string) => {
    if (!documentId) {
      alert("Document ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this document?",
    );

    if (!confirmed) return;

    try {
      await deleteDocument(documentId);

      setDocuments((prev) =>
        prev.filter(
          (document) =>
            document._id !== documentId && document.id !== documentId,
        ),
      );

      alert("Document deleted successfully.");
    } catch (error: any) {
      console.error("Delete document error:", error);

      alert(error?.message || "Failed to delete document.");
    }
  };

  
  const handleRunOcr = async (documentId: string) => {
    if (!documentId) return;

    setOcrRunningId(documentId);

    try {
      const res = await runDocumentOCR(documentId);
      await loadDocuments();
      if (res && res.document && res.ocrStatus === "completed") {
        setActiveOcrDoc(res.document);
      }
    } catch (error: any) {
      console.error("OCR extraction error:", error);
      alert(error?.message || "Failed to extract text from document.");
      await loadDocuments();
    } finally {
      setOcrRunningId(null);
    }
  };

  const handleRunCaseDocumentOcr = async (docId: string, _doc?: any) => {
    if (!docId || !id) return;
    setOcrRunningId(docId);
    try {
      const res = await runCaseDocumentOCR(id, docId);
      const updated = await getCase(id);
      setCaseItem(updated);
      if (res && res.document && res.ocrStatus === "completed") {
        setActiveOcrDoc(res.document);
      }
    } catch (error: any) {
      console.error("Case document OCR error:", error);
      alert(error?.message || "Failed to extract text from document.");
      const updated = await getCase(id);
      setCaseItem(updated);
    } finally {
      setOcrRunningId(null);
    }
  };

  const openPreview = (dataUrl: string) => {
    if (!dataUrl) return;
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) return;
    previewWindow.document.write(`
      <html>
        <head>
          <title>Document Preview</title>
          <style>
            html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #0f172a; display: flex; align-items: center; justify-content: center; }
            iframe, img { border: 0; max-width: 100%; max-height: 100%; width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          ${dataUrl.startsWith("data:image/") ? `<img src="${dataUrl}" alt="Preview" style="object-fit:contain;" />` : `<iframe src="${dataUrl}" allowfullscreen></iframe>`}
        </body>
      </html>
    `);
    previewWindow.document.close();
  };

  const downloadDataUrl = (dataUrl: string, fileName: string) => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  
  const handleStatusChange = async (status: string) => {
    if (!id) return;

    setUpdating(true);

    try {
      const updated = await updateCase(id, {
        status,
      });

      setCaseItem(updated?.case || updated?.data || updated);
    } catch (error) {
      console.error("Failed to update case status:", error);

      alert("Failed to update case status.");
    } finally {
      setUpdating(false);
    }
  };

  
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading case...</div>;
  }

  
  if (!caseItem) {
    return (
      <div className="space-y-4 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Case not found</h2>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-600 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const caseId = caseItem.id || caseItem.caseId || caseItem._id || id;

  const caseTitle = caseItem.title || "Untitled Case";

  const caseStatus = caseItem.status || "Pending";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-900"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{caseId}</h1>

          <p className="mt-1 text-lg text-gray-500">{caseTitle}</p>
        </div>

        <Badge status={caseStatus as any} className="px-4 py-2 text-sm" />
      </div>

      {}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {}
        <Card className="space-y-6 p-6 md:col-span-2">
          <h3 className="border-b border-gray-100 pb-2 text-lg font-bold">
            Incident Information
          </h3>

          {}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Incident Date</p>

              <p className="font-semibold text-gray-900">
                {caseItem.date || caseItem.incidentDate || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>

              <p className="font-semibold text-gray-900">{caseStatus}</p>
            </div>

            {caseItem.category && (
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>

                <p className="font-semibold text-gray-900">
                  {caseItem.category}
                </p>
              </div>
            )}

            {caseItem.location && (
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>

                <p className="font-semibold text-gray-900">
                  {caseItem.location}
                </p>
              </div>
            )}
          </div>

          {}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Description
            </p>

            <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-gray-900">
              {caseItem.description ||
                "No description available for this case."}
            </p>
          </div>

          {}
          {Array.isArray(caseItem.people) && caseItem.people.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-500">
                People Involved
              </p>

              <div className="space-y-2">
                {caseItem.people.map((person: any, index: number) => (
                  <div
                    key={person.id || person._id || index}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
                  >
                    <span className="font-medium text-gray-900">
                      {person.name || "Unknown Person"}
                    </span>

                    <span className="text-xs text-gray-500">
                      {person.relationship || person.role || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {Array.isArray(caseItem.documents) &&
            caseItem.documents.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    Supporting Documents ({caseItem.documents.length})
                  </p>
                  <span className="text-xs text-gray-400">
                    Uploaded during case filing
                  </span>
                </div>

                <div className="space-y-3">
                  {caseItem.documents.map((doc: any, index: number) => {
                    const docId = doc._id || doc.id || String(index);
                    const isProcessing = ocrRunningId === docId || doc.ocrStatus === "processing";

                    return (
                      <div
                        key={docId}
                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-semibold text-gray-900">
                              {doc.name ||
                                doc.documentName ||
                                doc.fileName ||
                                "Untitled Document"}
                            </span>

                            {}
                            {doc.ocrStatus === "completed" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                OCR: Completed
                                {doc.ocrQuality ? ` (${doc.ocrQuality})` : ""}
                              </span>
                            ) : isProcessing ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                                OCR: Processing...
                              </span>
                            ) : doc.ocrStatus === "failed" ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700"
                                title={doc.ocrError || "OCR processing failed"}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                OCR: Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                OCR: Not Run
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span>{doc.type || doc.documentType || "Document"}</span>
                            {doc.size ? <span>• {doc.size}</span> : null}
                            {doc.sha256 ? (
                              <span title={`SHA-256: ${doc.sha256}`}>
                                • SHA-256: {doc.sha256.slice(0, 10)}...
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap shrink-0 items-center gap-2">
                          {}
                          {doc.ocrStatus === "completed" && (
                            <button
                              type="button"
                              onClick={() => setActiveOcrDoc(doc)}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                            >
                              View Extracted Text
                            </button>
                          )}

                          {}
                          {(!doc.ocrStatus || doc.ocrStatus === "not_started") && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleRunCaseDocumentOcr(docId, doc)}
                              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                            >
                              {isProcessing ? "Extracting..." : "Extract Text"}
                            </button>
                          )}

                          {doc.ocrStatus === "failed" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleRunCaseDocumentOcr(docId, doc)}
                              className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {isProcessing ? "Retrying..." : "Retry OCR"}
                            </button>
                          )}

                          {}
                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() => openPreview(doc.dataUrl)}
                              className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Preview
                            </button>
                          )}

                          {}
                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() => downloadDataUrl(doc.dataUrl, doc.name)}
                              className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {}
          <div className="space-y-5 border-t border-gray-100 pt-6">
            {}
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
                {documents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900">Upload Document</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Document Name
                  </label>

                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g. FIR Copy"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  />
                </div>

                {}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Document Type
                  </label>

                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="FIR">FIR</option>

                    <option value="Investigation Report">
                      Investigation Report
                    </option>

                    <option value="Witness Statement">Witness Statement</option>

                    <option value="Evidence">Evidence</option>

                    <option value="Court Order">Court Order</option>

                    <option value="Final Report">Final Report</option>
                  </select>
                </div>
              </div>

              {}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Short description of the document"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                />
              </div>

              {}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  File
                </label>

                <input
                  id="document-file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Maximum file size: 10 MB
                </p>
              </div>

              {}
              <button
                type="button"
                onClick={handleDocumentUpload}
                disabled={uploading || !selectedFile}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>

            {}
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                placeholder="Search documents..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />

              <select
                value={documentFilter}
                onChange={(e) => setDocumentFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="">All Types</option>

                <option value="FIR">FIR</option>

                <option value="Investigation Report">
                  Investigation Report
                </option>

                <option value="Witness Statement">Witness Statement</option>

                <option value="Evidence">Evidence</option>

                <option value="Court Order">Court Order</option>

                <option value="Final Report">Final Report</option>
              </select>
            </div>

            {}
            {documentsLoading ? (
              <div className="py-6 text-center text-gray-500">
                Loading documents...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
                <p className="text-gray-500">
                  {documents.length === 0
                    ? "No documents found for this case."
                    : "No documents match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc: any, index: number) => {
                  const documentId = doc._id || doc.id;

                  const name =
                    doc.name ||
                    doc.documentName ||
                    doc.fileName ||
                    "Untitled Document";

                  const type = doc.documentType || doc.type || "Document";

                  return (
                    <div
                      key={documentId || index}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-gray-900">
                            {name}
                          </p>

                          {}
                          {doc.ocrStatus === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              OCR: Completed
                              {doc.ocrQuality ? ` (${doc.ocrQuality})` : ""}
                            </span>
                          ) : doc.ocrStatus === "processing" || ocrRunningId === documentId ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                              OCR: Processing...
                            </span>
                          ) : doc.ocrStatus === "failed" ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700"
                              title={doc.ocrError || "OCR processing failed"}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              OCR: Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                              OCR: Not Run
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500">
                          {type}

                          {doc.fileName && doc.fileName !== name
                            ? ` • ${doc.fileName}`
                            : ""}

                          {doc.sha256 ? ` • SHA-256: ${doc.sha256.slice(0, 10)}...` : ""}
                        </p>

                        {doc.description && (
                          <p className="mt-1 text-xs text-gray-400">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap shrink-0 items-center gap-2">
                        {}
                        {doc.ocrStatus === "completed" && (
                          <button
                            type="button"
                            onClick={() => setActiveOcrDoc(doc)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                          >
                            View Extracted Text
                          </button>
                        )}

                        {}
                        {canEditCase && (
                          <>
                            {(!doc.ocrStatus || doc.ocrStatus === "not_started") && (
                              <button
                                type="button"
                                disabled={ocrRunningId === documentId}
                                onClick={() => handleRunOcr(documentId)}
                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                              >
                                {ocrRunningId === documentId ? "Extracting..." : "Extract Text"}
                              </button>
                            )}

                            {doc.ocrStatus === "failed" && (
                              <button
                                type="button"
                                disabled={ocrRunningId === documentId}
                                onClick={() => handleRunOcr(documentId)}
                                className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                              >
                                {ocrRunningId === documentId ? "Retrying..." : "Retry OCR"}
                              </button>
                            )}
                          </>
                        )}

                        {}
                        <button
                          type="button"
                          disabled={!documentId}
                          onClick={() =>
                            handleDocumentDownload(
                              documentId,
                              doc.fileName || name,
                            )
                          }
                          className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          Download
                        </button>

                        {}
                        <button
                          type="button"
                          disabled={!documentId}
                          onClick={() => handleDocumentDelete(documentId)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {}
        <Card className="space-y-6 p-6">
          <h3 className="border-b border-gray-100 pb-2 text-lg font-bold">
            Quick Actions
          </h3>

          <button
            onClick={() => handleStatusChange("Active")}
            disabled={updating || caseStatus === "Active" || !canEditCase}
            className="w-full rounded-lg bg-green-50 py-2 font-medium text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating && caseStatus !== "Active"
              ? "Updating..."
              : "Mark as Active"}
          </button>

          <button
            onClick={() => router.push("/documents")}
            className="w-full rounded-lg border border-gray-200 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Manage Documents
          </button>

          <button
            onClick={() => handleStatusChange("Closed")}
            disabled={updating || caseStatus === "Closed" || !canEditCase}
            className="w-full rounded-lg border border-red-200 bg-red-50 py-2 font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating && caseStatus !== "Closed" ? "Updating..." : "Close Case"}
          </button>
        </Card>
      </div>

      {}
      {activeOcrDoc && (
        <OcrTextModal
          isOpen={!!activeOcrDoc}
          onClose={() => setActiveOcrDoc(null)}
          documentName={activeOcrDoc.name || activeOcrDoc.fileName || "Document"}
          documentType={activeOcrDoc.documentType || activeOcrDoc.type}
          ocrText={activeOcrDoc.ocrText || ""}
          normalizedOcrText={activeOcrDoc.normalizedOcrText || activeOcrDoc.ocrText || ""}
          ocrConfidence={activeOcrDoc.ocrConfidence}
          ocrQuality={activeOcrDoc.ocrQuality}
          pageCount={activeOcrDoc.pageCount}
          ocrProcessedAt={activeOcrDoc.ocrProcessedAt}
          sha256={activeOcrDoc.sha256}
          canEdit={canEditCase}
          onRerunOcr={async () => {
            const docId = activeOcrDoc._id || activeOcrDoc.id;
            if (docId && id) {
              if (activeOcrDoc.dataUrl) {
                await handleRunCaseDocumentOcr(docId, activeOcrDoc);
                const updatedCase = await getCase(id);
                setCaseItem(updatedCase);
                const refreshed = (updatedCase?.documents || []).find(
                  (d: any) => (d._id || d.id || String(d._id)) === docId
                );
                if (refreshed) {
                  setActiveOcrDoc(refreshed);
                }
              } else {
                await handleRunOcr(docId);
                const updated = await getDocuments(id);
                const docsList = Array.isArray(updated) ? updated : (updated?.documents || []);
                const refreshedDoc = docsList.find((d: any) => (d._id || d.id) === docId);
                if (refreshedDoc) {
                  setActiveOcrDoc(refreshedDoc);
                }
              }
            }
          }}
          isRerunning={ocrRunningId === (activeOcrDoc._id || activeOcrDoc.id)}
        />
      )}
    </div>
  );
}
