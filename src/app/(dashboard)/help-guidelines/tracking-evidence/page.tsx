"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  GitCommit,
  Activity,
  History,
  Lock,
  ScanText,
  Layers,
  HelpCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";

export default function TrackingEvidenceGuidelinePage() {
  const steps = [
    {
      step: "01",
      title: "Understand Evidence Requirements",
      subtitle: "Legal Admissibility & Packaging Standards",
      icon: ShieldAlert,
      color: "blue",
      description:
        "Every piece of evidence collected must satisfy strict statutory standards of legal admissibility, physical preservation, and tamper-evident packaging before digital ingestion.",
      checklist: [
        "Maintain physical integrity: Ensure physical evidence is placed in tamper-evident forensic bags with signed seal tags.",
        "Digital evidence safeguards: Use hardware write-blockers when seizing mobile phones, storage media, or hard drives to prevent metadata alteration.",
        "Seizure documentation: Prepare an immediate Seizure Memo (Panchnama) signed by independent punch witnesses at the scene.",
        "Assign a unique exhibit reference code corresponding to the Case ID (e.g., FIR-2026-089-EX01).",
      ],
      warning:
        "Any compromise in initial evidence packaging or unsealed transit may render the exhibit inadmissible under judicial scrutiny.",
    },
    {
      step: "02",
      title: "Upload Evidence / Document",
      subtitle: "Digital Ingestion & Case Correlation",
      icon: UploadCloud,
      color: "indigo",
      description:
        "Upload scanned seizure memos, digital photos, forensic extractions, and multimedia exhibits through the Janmitra Document Management portal.",
      checklist: [
        "Navigate to the 'Documents' module (/documents) from the sidebar.",
        "Correlate exhibit to case: Select the corresponding Case ID from the active cases dropdown.",
        "Choose appropriate document classification (e.g., 'Forensic Report', 'CCTV Video Clip', 'Medical Report', 'Seizure Memo').",
        "Upload verified files (PDF, JPEG, PNG up to 25MB per document). Ensure high resolution and legibility of all official stamps.",
      ],
      tip: "For voluminous video or audio files, compress the file using certified lossless forensic codecs to meet size requirements while preserving signal fidelity.",
    },
    {
      step: "03",
      title: "Verify Document Details & Automated OCR",
      subtitle: "Checksum Validation & Machine Extraction",
      icon: ScanText,
      color: "emerald",
      description:
        "Verify the document metadata and run the integrated OCR engine to extract, transcribe, and index textual content for full-text searchability.",
      checklist: [
        "Cryptographic Hash: Verify the automatically generated SHA-256 hash checksum assigned to the file upon upload.",
        "Trigger OCR Text Extraction: Click 'Run OCR' on scanned documents to process multilingual Hindi and English scripts.",
        "Review OCR Output: Open the OCR Text Modal to inspect transcribed text, verify accuracy against the scan, and save corrections.",
        "Confirm metadata integrity: Verify file timestamp, uploader identification, and document type tags.",
      ],
    },
    {
      step: "04",
      title: "Understand Chain of Custody",
      subtitle: "Unbroken Chronological Custody Trail",
      icon: GitCommit,
      color: "purple",
      description:
        "The Chain of Custody is the legally recognized chronological record proving that evidence remained secure, unaltered, and accountable from seizure through trial.",
      checklist: [
        "Every physical transfer (e.g., from Investigating Officer to Forensic Science Lab) must be recorded immediately in the system.",
        "Record the full name, designation, badge number, and authorized station of both the dispatching and receiving officers.",
        "Document the explicit purpose of transfer (e.g., 'Ballistic Examination', 'Cyber Forensic Extraction', 'Malkhana Safe Custody').",
        "Generate and counter-sign digital transfer receipts to eliminate temporal gaps in accountability.",
      ],
      warning:
        "A broken chain of custody is a primary ground for evidence suppression in criminal trials. Never transfer evidence without immediate digital logging.",
    },
    {
      step: "05",
      title: "Track Evidence Status",
      subtitle: "Real-Time Lifecycle Monitoring",
      icon: Activity,
      color: "amber",
      description:
        "Monitor the operational status of exhibits as they progress through forensic evaluation, supervisory audit, and judicial presentation.",
      checklist: [
        "Uploaded: Evidence successfully logged into the repository; awaiting preliminary investigator verification.",
        "Under Review: Investigating Officer is examining exhibits and correlating them with witness statements.",
        "Forensic Analysis: Exhibit transferred to state/central FSL; tracking lab requisition number and expected report date.",
        "Verified & Locked: Evidence authenticated with forensic certificates and sealed against further modification.",
        "Court Exhibited: Marked as formal prosecution exhibit (e.g., 'Exhibit P-1') before the presiding magistrate.",
      ],
    },
    {
      step: "06",
      title: "Review Evidence History & Audit Trail",
      subtitle: "Immutable Access Logs & Tamper Detection",
      icon: History,
      color: "cyan",
      description:
        "Utilize the system-wide Audit Trail to inspect every access event, download, status transition, and supervisory review associated with the evidence.",
      checklist: [
        "Navigate to the 'Audit Trail' section (/audit-trail) to review complete chronological event logs.",
        "Filter audit logs by Case ID, Document ID, or Officer Name to trace evidentiary interactions.",
        "Audit items track: Officer identity, exact UTC/IST timestamp, client IP address, device type, and action performed.",
        "Monitor security alerts: Investigate any flagged unusual downloads or unauthorized permission attempts.",
      ],
      tip: "Janmitra audit records are cryptographically chained and cannot be purged or altered, providing tamper-proof evidence of procedural regularity.",
    },
    {
      step: "07",
      title: "Verify & Close the Evidence Process",
      subtitle: "Judicial Presentation & Final Disposition",
      icon: Lock,
      color: "emerald",
      description:
        "Conclude evidentiary lifecycle following judicial verdict or formal case disposal in compliance with court orders.",
      checklist: [
        "Obtain certified copies of the final judicial order specifying evidence disposal directives.",
        "Classify disposition outcome: Return to rightful owner, confiscation to state treasury, or authorized destruction.",
        "Execute formal handover receipt signed by the court malkhana custodian and the receiving party.",
        "Transition digital exhibit status to 'Archived / Closed' with supervisory officer sign-off.",
      ],
    },
  ];

  const custodyStages = [
    {
      title: "1. Collection & Seizure",
      desc: "Recovered at crime scene with Panchnama & tamper-proof seal.",
    },
    {
      title: "2. Safe Malkhana Custody",
      desc: "Logged into police station evidence room under custodian charge.",
    },
    {
      title: "3. Forensic Examination",
      desc: "Dispatched to FSL under sealed road certificate with tracking memo.",
    },
    {
      title: "4. Judicial Production",
      desc: "Presented before court of law with Section 65B/BSA certificate.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* TOP NAVIGATION / BREADCRUMB */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Help & Guidelines</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/audit-trail"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-blue-600"
          >
            <History className="h-4 w-4 text-gray-500" />
            <span>Audit Trail</span>
          </Link>

          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            <span>Go to Documents</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* HEADER HERO */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100/60 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Digital Forensics & Integrity Protocol · SOP-02</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Tracking Evidence & Chain of Custody
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              Standard operating guidelines for investigating officers to
              preserve, upload, verify, and trace the uninterrupted chain of
              custody for physical and digital exhibits.
            </p>
          </div>

          {/* QUICK STATS / METADATA */}
          <div className="flex shrink-0 flex-row gap-3 rounded-xl border border-blue-100 bg-white/90 p-3.5 shadow-xs md:flex-col md:min-w-[190px]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Total Steps
              </p>
              <p className="text-lg font-bold text-gray-900">7 Milestones</p>
            </div>
            <div className="hidden border-t border-gray-100 md:block" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Verification Standard
              </p>
              <p className="text-sm font-semibold text-blue-700">
                SHA-256 / BSA Compliant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CHAIN OF CUSTODY EXPLAINER CARD */}
      <Card className="border-blue-100 bg-[#fbfdff] p-5 md:p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              What is the Chain of Custody?
            </h2>
            <p className="text-xs text-gray-500">
              The continuous, unbroken paper and digital trail proving evidence integrity from scene to court.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {custodyStages.map((stage, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-blue-100/80 bg-white p-3.5 shadow-xs"
            >
              <p className="text-xs font-bold text-blue-700">{stage.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-gray-600">
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* IMPORTANT INTEGRITY NOTICE */}
      <div className="flex items-start gap-3.5 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-950">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-blue-900">
            Cryptographic Integrity & Digital Admissibility
          </p>
          <p className="mt-0.5 text-blue-800">
            All files ingested into Janmitra are automatically hashed with SHA-256
            cryptographic algorithms at the time of upload. This hash is
            permanently recorded in the Audit Trail and serves as conclusive
            proof in judicial proceedings that the evidence has not been tampered
            with, altered, or replaced.
          </p>
        </div>
      </div>

      {/* STEP BY STEP TIMELINE CARDS */}
      <div className="space-y-4">
        {steps.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.step} className="p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* STEP NUMBER BADGE & ICON */}
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                    Step {item.step}
                  </span>
                </div>

                {/* STEP CONTENT */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h2>
                    <span className="text-xs font-medium text-blue-600">
                      {item.subtitle}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>

                  {/* CHECKLIST */}
                  {item.checklist && item.checklist.length > 0 && (
                    <div className="mt-3.5 rounded-lg border border-gray-100 bg-gray-50/60 p-3.5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Verification & Handling Points
                      </p>
                      <ul className="space-y-2 text-xs text-gray-700">
                        {item.checklist.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                            <span className="leading-snug">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* TIP CALLOUT */}
                  {item.tip && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <p className="leading-relaxed">
                        <strong className="font-semibold">Best Practice: </strong>
                        {item.tip}
                      </p>
                    </div>
                  )}

                  {/* WARNING CALLOUT */}
                  {item.warning && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <p className="leading-relaxed">
                        <strong className="font-semibold">Caution: </strong>
                        {item.warning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* BOTTOM ACTION BANNER */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-md">
        <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-lg font-bold">Access the Evidence Management Portal</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-blue-100 sm:text-sm">
              Upload documents, inspect OCR transcripts, or track the audit trail
              for active legal case files.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/audit-trail"
              className="rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:text-sm"
            >
              Audit Trail
            </Link>

            <Link
              href="/documents"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:text-sm"
            >
              <span>Manage Documents</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>

      {/* FOOTER SUPPORT NOTE */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Need technical assistance with OCR or file hashing? Contact Support at 1-800-LEGAL-SYS.</span>
        </div>
        <Link href="/help" className="text-blue-600 hover:underline">
          Help & Guidelines Hub
        </Link>
      </div>
    </div>
  );
}
