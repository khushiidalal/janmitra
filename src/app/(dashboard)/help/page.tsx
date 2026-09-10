"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  Headphones,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Rocket,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Card from "@/components/ui/Card";

type FAQItem = {
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    question: "What constitutes a valid Chain of Custody record?",
    answer:
      "A valid Chain of Custody record documents each transfer, handling event, and responsible person associated with evidence from collection through final disposition.",
  },
  {
    question: "How long are closed cases retained in the system?",
    answer:
      "Closed cases are retained according to the department's legal, administrative, and archival retention policies.",
  },
  {
    question: "Can I modify a submitted First Information Report (FIR)?",
    answer:
      "Submitted FIRs are generally locked for integrity. Authorized users may request amendments or add supplementary information where permitted.",
  },
];

export default function HelpGuidelinesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-gray-900">
          Help & Guidelines
        </h1>

        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Access critical legal resources, procedural documentation, and system
          support to navigate your case management process.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        {/* LEFT CONTENT */}
        <div className="space-y-6">
          {/* Getting Started */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-gray-700" />
              <h2 className="text-base font-semibold text-gray-900">
                Getting Started
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Filing a New Case */}
              <Link
                href="/help-guidelines/filing-new-case"
                className="group block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Card className="p-4 transition-all duration-150 group-hover:border-blue-300 group-hover:shadow-md">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-blue-50">
                    <BriefcaseBusiness className="h-4 w-4 text-gray-700 transition-colors group-hover:text-blue-600" />
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    Filing a New Case
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-gray-500">
                    Step-by-step instructions on submitting a formal complaint and
                    required documentation.
                  </p>
                </Card>
              </Link>

              {/* Tracking Evidence */}
              <Link
                href="/help-guidelines/tracking-evidence"
                className="group block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Card className="p-4 transition-all duration-150 group-hover:border-blue-300 group-hover:shadow-md">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-blue-50">
                    <FileText className="h-4 w-4 text-gray-700 transition-colors group-hover:text-blue-600" />
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    Tracking Evidence
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-gray-500">
                    Understand how to monitor the chain of custody and verify evidence
                    submission status.
                  </p>
                </Card>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-700" />
              <h2 className="text-base font-semibold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>

            <Card className="overflow-hidden">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={index}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-gray-50"
                    >
                      <span className="pr-4 text-sm font-medium text-gray-900">
                        {item.question}
                      </span>

                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 text-sm leading-6 text-gray-500">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4">
          {/* Support */}
          <Card className="border-t-2 border-t-blue-600 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Headphones className="h-5 w-5 text-blue-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              Institutional Support
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              For urgent matters or technical issues requiring immediate
              administrative override.
            </p>

            <div className="my-5 border-t border-gray-200" />

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>1-800-LEGAL-SYS</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@justice.gov</span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4" />

                <span className="leading-5">
                  Central Records Division
                  <br />
                  400 Justice Ave, Block B
                  <br />
                  Capital City, CC 10001
                </span>
              </div>
            </div>
          </Card>

          {/* Glossary */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-700" />
              <h3 className="text-base font-semibold text-gray-900">
                Legal Glossary
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">FIR</h4>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  First Information Report: the initial formal recording of a
                  complaint.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Chain of Custody
                </h4>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Chronological documentation trail showing the seizure,
                  custody, control, and transfer of evidence.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Subpoena
                </h4>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  A writ ordering a person to attend a court or produce
                  documents.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
