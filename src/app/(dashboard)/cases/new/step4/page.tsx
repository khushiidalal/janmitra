'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import {
  Cloud,
  UploadCloud,
  File as FileIcon,
  Trash2,
  ChevronDown,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import Stepper from '@/components/ui/Stepper';
import Card from '@/components/ui/Card';
import { useDraft } from '@/lib/useDraft';

function Step4DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const { draft, setDraft } = useDraft();

  
  
  
  

  const stageParam = searchParams?.get('stage');

  const [currentStage, setCurrentStage] =
    useState<3 | 4>(() => {
      return stageParam === '4' ? 4 : 3;
    });

  useEffect(() => {
    if (stageParam === '3') setCurrentStage(3);
    else if (stageParam === '4') setCurrentStage(4);
  }, [stageParam]);

  
  
  

  const [evidenceType, setEvidenceType] =
    useState('');

  const [evidenceTitle, setEvidenceTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [sourceLocation, setSourceLocation] =
    useState('');

  const [supportingDetails, setSupportingDetails] =
    useState('');

  
  
  

  useEffect(() => {
    const evidence = draft.evidence;

    if (!evidence) return;

    setEvidenceType(
      evidence.evidenceType || ''
    );

    setEvidenceTitle(
      evidence.evidenceTitle || ''
    );

    setDescription(
      evidence.description || ''
    );

    setSourceLocation(
      evidence.sourceLocation || ''
    );

    setSupportingDetails(
      evidence.supportingDetails || ''
    );
  }, [draft.evidence]);

  
  
  

  const saveEvidenceDetails = () => {
    setDraft({
      ...draft,

      evidence: {
        evidenceType,
        evidenceTitle,
        description,
        sourceLocation,
        supportingDetails,
      },
    });
  };

  const handleEvidenceContinue = () => {
    saveEvidenceDetails();

    setCurrentStage(4);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleEvidenceSkip = () => {
    setCurrentStage(4);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  
  
  

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      !e.target.files ||
      e.target.files.length === 0
    ) {
      return;
    }

    const selectedFile = e.target.files[0];

    
    const maxSize =
      20 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      alert(
        'File size must be 20MB or less.'
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const newFile = {
        id:
          Math.random()
            .toString(36)
            .substring(2, 11),

        name: selectedFile.name,

        type:
          selectedFile.type
            .split('/')[1]
            ?.toUpperCase() || 'FILE',

        size:
          (
            selectedFile.size /
            (1024 * 1024)
          ).toFixed(1) + ' MB',

        dataUrl:
          event.target?.result as string,
      };

      setDraft({
        ...draft,

        documents: [
          ...(draft.documents || []),
          newFile,
        ],
      });
    };

    reader.readAsDataURL(
      selectedFile
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  
  
  

  const handleRemoveFile = (
    id: string
  ) => {
    setDraft({
      ...draft,

      documents: (
        draft.documents || []
      ).filter(
        (file: any) =>
          file.id !== id
      ),
    });
  };

  
  
  

  const openPreview = (
    dataUrl: string
  ) => {
    if (!dataUrl) return;

    const previewWindow =
      window.open(
        'about:blank',
        '_blank'
      );

    if (!previewWindow) return;

    previewWindow.document.write(`
      <html>
        <head>
          <title>Document Preview</title>
          <style>
            html, body {
              margin: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }

            iframe {
              border: 0;
              width: 100%;
              height: 100%;
            }
          </style>
        </head>

        <body>
          <iframe
            src="${dataUrl}"
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `);

    previewWindow.document.close();
  };

  
  
  

  const handleBackToPeople = () => {
    router.push(
      '/cases/new/step2'
    );
  };

  
  
  

  const handleBackToEvidence = () => {
    setCurrentStage(3);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  
  
  

  const handleDocumentsContinue = () => {
    router.push(
      '/cases/new/step5'
    );
  };

  return (
    <div className="mx-auto max-w-[1080px] space-y-4">

      {}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Case Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage, track, and review active First Information
          Reports and Complaints.
        </p>
      </div>

      {}
      <Stepper
        currentStep={currentStage}
      />

      {}
      {}
      {}

      {currentStage === 3 && (
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          {}
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Evidence Details
            </h2>

            <p className="mt-1 max-w-[850px] text-sm leading-5 text-slate-600">
              Describe any evidence related to this incident -
              you'll attach the actual files in the next step.
              This step is optional if no evidence is available yet.
            </p>
          </div>

          <div className="mt-4 space-y-4">

            {}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Evidence Type
                </label>

                <select
                  value={evidenceType}
                  onChange={(e) =>
                    setEvidenceType(
                      e.target.value
                    )
                  }
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    text-sm
                    text-slate-700
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >
                  <option value="">
                    Select evidence type ...
                  </option>

                  <option value="Photo/Video">
                    Photo / Video
                  </option>

                  <option value="Audio">
                    Audio Recording
                  </option>

                  <option value="Document">
                    Document
                  </option>

                  <option value="Physical Evidence">
                    Physical Evidence
                  </option>

                  <option value="Digital Evidence">
                    Digital Evidence
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Evidence Title
                </label>

                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) =>
                    setEvidenceTitle(
                      e.target.value
                    )
                  }
                  placeholder="CCTV Footage of Alley"
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    text-sm
                    outline-none
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>
            </div>

            {}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Enter description"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  text-sm
                  outline-none
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>

            {}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Source / Location Found
                </label>

                <input
                  type="text"
                  value={sourceLocation}
                  onChange={(e) =>
                    setSourceLocation(
                      e.target.value
                    )
                  }
                  placeholder="Enter source or location"
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    text-sm
                    outline-none
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              {}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Optional Supporting Details
                </label>

                <input
                  type="text"
                  value={supportingDetails}
                  onChange={(e) =>
                    setSupportingDetails(
                      e.target.value
                    )
                  }
                  placeholder="Enter supporting details"
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    text-sm
                    outline-none
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>
            </div>
          </div>

          {}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

            {}
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Cloud className="h-4 w-4" />

              <span>
                Your progress is saved automatically
              </span>
            </div>

            {}
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={handleBackToPeople}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <button
                type="button"
                onClick={handleEvidenceSkip}
                className="
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={handleEvidenceContinue}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-blue-800
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  hover:bg-blue-900
                "
              >
                Save and Continue

                <ArrowRight className="h-3.5 w-3.5" />
              </button>

            </div>
          </div>
        </Card>
      )}

      {}
      {}
      {}

      {currentStage === 4 && (
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          {}
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Supporting Documents
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Upload any supporting files - existing FIR
              copies, images, PDFs, or other relevant
              documents.
            </p>
          </div>

          {}
          <div
            className="
              mt-4
              flex
              min-h-[220px]
              flex-col
              items-center
              justify-center
              rounded-xl
              border-2
              border-dashed
              border-blue-200
              bg-blue-50/40
              px-6
              py-8
            "
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <UploadCloud className="h-6 w-6" />
            </div>

            <h3 className="text-sm font-semibold text-slate-900">
              Drag and drop files here
            </h3>

            <p className="my-2 text-sm text-slate-500">
              or
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
            />

            <button
              type="button"
              onClick={handleBrowseClick}
              className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                hover:bg-slate-50
              "
            >
              Browse Files
            </button>

            <p className="mt-3 text-[10px] text-slate-400">
              Accepted types: PDF, JPG, PNG, DOCX.
              Max size 20MB per file.
            </p>
          </div>

          {}
          <div className="mt-4 space-y-3">

            <h3 className="text-sm font-semibold text-slate-900">
              Uploaded Files (
              {(draft.documents || []).length}
              )
            </h3>

            {(draft.documents || []).map(
              (file: any) => (
                <div
                  key={file.id}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50/60
                    p-3
                  "
                >

                  {}
                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <FileIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="max-w-[260px] truncate text-sm font-semibold text-slate-900">
                        {file.name}
                      </h4>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {file.type || 'FILE'}
                        {file.size
                          ? ` • ${file.size}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {}
                  <div className="flex shrink-0 items-center gap-2">

                    {}
                    <button
                      type="button"
                      onClick={() =>
                        openPreview(
                          file.dataUrl
                        )
                      }
                      className="
                        flex
                        items-center
                        gap-1
                        rounded-lg
                        border
                        border-slate-300
                        bg-white
                        px-3
                        py-1.5
                        text-sm
                        text-slate-700
                        hover:bg-slate-50
                      "
                    >
                      <ExternalLink className="h-3.5 w-3.5" />

                      <span className="hidden sm:inline">
                        Preview
                      </span>
                    </button>

                    {}
                    <div className="relative hidden md:block">

                      <select
                        defaultValue="FIR Copy"
                        className="
                          appearance-none
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          py-1.5
                          pl-3
                          pr-8
                          text-sm
                          text-slate-700
                          outline-none
                        "
                      >
                        <option>
                          FIR Copy
                        </option>

                        <option>
                          Photo Evidence
                        </option>

                        <option>
                          Supporting Document
                        </option>

                        <option>
                          Other
                        </option>
                      </select>

                      <ChevronDown
                        className="
                          pointer-events-none
                          absolute
                          right-2
                          top-1/2
                          h-3.5
                          w-3.5
                          -translate-y-1/2
                          text-slate-500
                        "
                      />
                    </div>

                    {}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveFile(
                          file.id
                        )
                      }
                      className="
                        rounded-md
                        p-2
                        text-slate-400
                        hover:bg-red-50
                        hover:text-red-600
                      "
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>
                </div>
              )
            )}

            {}
            {(!draft.documents ||
              draft.documents.length === 0) && (
              <p className="py-3 text-center text-sm text-slate-500">
                No files uploaded yet.
              </p>
            )}

          </div>

          {}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

            {}
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Cloud className="h-4 w-4" />

              <span>
                Your progress is saved automatically
              </span>
            </div>

            {}
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={handleBackToEvidence}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <button
                type="button"
                onClick={handleDocumentsContinue}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-blue-800
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  hover:bg-blue-900
                "
              >
                Save and Continue

                <ArrowRight className="h-3.5 w-3.5" />
              </button>

            </div>
          </div>
        </Card>
      )}

    </div>
  );
}

export default function Step4DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <Step4DocumentsContent />
    </Suspense>
  );
}
