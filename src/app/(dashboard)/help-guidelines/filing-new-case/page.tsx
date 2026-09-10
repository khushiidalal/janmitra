"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ClipboardList,
  UserCheck,
  MapPin,
  UploadCloud,
  FileCheck2,
  Send,
  Hash,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";

export default function FilingNewCaseGuidelinePage() {
  const steps = [
    {
      step: "01",
      title: "Understand the Complaint Requirements",
      subtitle: "Legal Classification & Jurisdictional Scope",
      icon: Scale,
      color: "blue",
      description:
        "Before registering a complaint, determine whether the reported incident falls under your jurisdiction and establish if the offense is cognizable or non-cognizable under statutory law.",
      checklist: [
        "Ascertain whether the incident occurred within your precinct or division boundaries.",
        "Differentiate between cognizable offenses (mandatory FIR registration) and non-cognizable complaints (requiring magistrate direction).",
        "Confirm if immediate protective or medical measures are required for the complainant before recording testimony.",
      ],
      tip: "Zero FIR Protocol: If the offense is serious but occurred outside your geographical jurisdiction, register a Zero FIR immediately and transfer it to the concerned station within 24 hours.",
    },
    {
      step: "02",
      title: "Collect Required Information",
      subtitle: "Pre-Filing Document & Fact Gathering",
      icon: ClipboardList,
      color: "indigo",
      description:
        "Ensure all necessary documentation, primary witness contact details, and supporting evidence are assembled before starting the digital registration entry to avoid session timeouts.",
      checklist: [
        "Obtain a signed or thumb-printed written complaint from the informant or victim.",
        "Collect primary identification documents (Aadhaar, Voter ID, Driving License, or Passport).",
        "Record exact chronological details: date, estimated time window, and specific landmark or GPS coordinates.",
        "List all available preliminary exhibits, photos, or digital files ready for attachment.",
      ],
      warning:
        "Ensure any handwritten complaint is legible. If typed or transcribed on behalf of an illiterate complainant, read it back verbatim and obtain their recorded confirmation.",
    },
    {
      step: "03",
      title: "Enter Complainant / Involved-Person Details",
      subtitle: "Identity Verification & Representation",
      icon: UserCheck,
      color: "emerald",
      description:
        "Accurately input the informant's biographical data, contact points, and legal representation status into Step 1 of the case registration module.",
      checklist: [
        "Full Legal Name: Enter the legal name matching government-issued credentials.",
        "Contact Information: Provide an active mobile phone number and verified email address for automated dispatch of Case ID updates.",
        "Government ID Proof: Record the ID document type and unique identification number.",
        "Present & Permanent Address: Complete address including postal code and administrative district.",
        "Informant Category: Categorize whether the informant is the victim, an eyewitness, a legal representative, or a reporting public servant.",
      ],
    },
    {
      step: "04",
      title: "Enter Incident Details",
      subtitle: "Locus In Quo, Timestamp & Narrative",
      icon: MapPin,
      color: "amber",
      description:
        "Record the factual details of the incident. Maintain an objective, chronological, and concise narrative of events as described by the complainant.",
      checklist: [
        "Select the primary legal category and relevant legal code sections.",
        "Specify the exact date and time of occurrence (or date range for continuous offenses).",
        "Enter the exact place of occurrence (landmark, street, police station jurisdiction).",
        "Draft an objective, chronological incident summary without personal conjecture or subjective bias.",
        "Record any delay in reporting and document the specific explanation provided by the complainant.",
      ],
    },
    {
      step: "05",
      title: "Add Supporting Documents & Evidence",
      subtitle: "Initial Exhibits & Document Attachments",
      icon: UploadCloud,
      color: "purple",
      description:
        "Upload verified digital copies of the written complaint, seizure memos, site photographs, medical reports, or preliminary forensic documents.",
      checklist: [
        "Accepted formats: PDF for official documents; JPG, PNG for scene photographs (up to 25MB per file).",
        "Ensure scans are clear, upright, and legible with all official stamps and signatures visible.",
        "Assign descriptive titles and appropriate document categories (e.g., 'Initial Complaint Scan', 'Scene of Crime Photo').",
        "Verify that digital photos retain EXIF metadata (timestamp and location coordinates) when possible.",
      ],
      warning:
        "Do not redact original evidence files before uploading. Redactions for public records are handled separately under supervisory review.",
    },
    {
      step: "06",
      title: "Review All Information",
      subtitle: "Pre-Submission Audit & Data Verification",
      icon: FileCheck2,
      color: "cyan",
      description:
        "Carefully inspect the aggregated case summary. Cross-verify every field against the physical complaint and supporting records before final submission.",
      checklist: [
        "Cross-check name spelling, contact numbers, and ID numbers against uploaded documents.",
        "Verify that statutory sections accurately reflect the allegations described in the narrative.",
        "Ensure all uploaded exhibits are successfully attached and accessible.",
        "Confirm that mandatory fields across all sections are completely populated.",
      ],
      tip: "You can navigate back to earlier steps using the step indicators to rectify any clerical inaccuracies without losing previously entered data.",
    },
    {
      step: "07",
      title: "Submit the Case",
      subtitle: "Cryptographic Authorization & Registry Entry",
      icon: Send,
      color: "blue",
      description:
        "Execute the final submission to transmit the record into the Janmitra centralized legal case database.",
      checklist: [
        "Confirm your official officer credentials and authorization to register this record.",
        "Review the statutory declaration certifying that the complaint has been accurately recorded.",
        "Click 'Submit Case' to generate the immutable cryptographic record and commit the case to the database.",
      ],
      warning:
        "Once submitted, the core incident narrative and filing timestamp are locked to ensure judicial integrity. Subsequent updates must be recorded via supplementary Case Diary entries.",
    },
    {
      step: "08",
      title: "Case ID & Submission Confirmation",
      subtitle: "Unique Identifier, Audit Trail & Next Steps",
      icon: Hash,
      color: "emerald",
      description:
        "Upon successful submission, the system automatically allocates a unique Case Identification Number and creates a permanent entry in the institutional Audit Trail.",
      checklist: [
        "Case ID Allocation: A unique alphanumeric identifier (e.g., FIR-2026-089) is generated immediately.",
        "Acknowledgement Slip: Print or export the official acknowledgement copy and furnish it to the complainant free of cost.",
        "Automated Notifications: The system transmits SMS/email confirmation containing the Case ID to the complainant.",
        "Investigation Assignment: Assign the case docket to the designated Investigating Officer (IO) or forward it for supervisory endorsement.",
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Help & Guidelines</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span>Start New Case</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100/60 px-3 py-1 text-xs font-semibold text-blue-700">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              <span>Standard Operating Procedure · SOP-01</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Filing a New Case
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              Comprehensive operational guideline for law enforcement officers
              and registry personnel to formally record, verify, and register
              complaints within the Janmitra Legal Investigation System.
            </p>
          </div>

          {}
          <div className="flex shrink-0 flex-row gap-3 rounded-xl border border-blue-100 bg-white/90 p-3.5 shadow-xs md:flex-col md:min-w-[190px]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Total Steps
              </p>
              <p className="text-lg font-bold text-gray-900">8 Key Stages</p>
            </div>
          
          </div>
        </div>
      </div>

      {}
      <div className="flex items-start gap-3.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-amber-900">
            Statutory Compliance Reminder
          </p>
          <p className="mt-0.5 text-amber-800">
            Registration of a First Information Report (FIR) for cognizable
            offenses is mandatory under legal statutes. Any refusal or willful
            delay in recording a cognizable complaint may constitute official
            dereliction of duty under applicable penal provisions.
          </p>
        </div>
      </div>

      {}
      <div className="space-y-4">
        {steps.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.step} className="p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {}
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                    Step {item.step}
                  </span>
                </div>

                {}
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

                  {}
                  {item.checklist && item.checklist.length > 0 && (
                    <div className="mt-3.5 rounded-lg border border-gray-100 bg-gray-50/60 p-3.5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Operational Checklist
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

                  {}
                  {item.tip && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
                      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <p className="leading-relaxed">
                        <strong className="font-semibold">Best Practice: </strong>
                        {item.tip}
                      </p>
                    </div>
                  )}

                  {}
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

      {}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-md">
        <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-lg font-bold">Ready to File a New Complaint?</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-blue-100 sm:text-sm">
              Proceed to the Case Registration form to enter the required details
              according to the procedural guidelines above.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/help"
              className="rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:text-sm"
            >
              Back to Guidelines
            </Link>

            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:text-sm"
            >
              <span>Start New Case</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>

      {}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Need administrative clarification? Contact Institutional Support at 1-800-LEGAL-SYS.</span>
        </div>
        <Link href="/help" className="text-blue-600 hover:underline">
          Help & Guidelines Hub
        </Link>
      </div>
    </div>
  );
}
