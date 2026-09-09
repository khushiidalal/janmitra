'use client';

import { useEffect, useState } from 'react';
import {
  Edit2,
  User,
  FileText,
  Image,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import Stepper from '@/components/ui/Stepper';

import {
  addCase,
  getDraft,
  clearDraft,
} from '@/lib/api';

import { EMPTY_DRAFT } from '@/lib/useDraft';

export default function Step5Review() {
  const router = useRouter();

  const [draft, setDraft] =
    useState<any>(EMPTY_DRAFT);

  const [confirmed, setConfirmed] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  // -----------------------------------------
  // Load latest server-side draft
  // -----------------------------------------

  useEffect(() => {
    let active = true;

    getDraft()
      .then((data) => {
        if (!active) return;

        setDraft({
          ...EMPTY_DRAFT,
          ...(data || {}),
        });
      })
      .catch(() => {
        if (!active) return;

        setDraft({
          ...EMPTY_DRAFT,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const evidence =
    draft.evidence || {};

  const people =
    Array.isArray(draft.people)
      ? draft.people
      : [];

  const documents =
    Array.isArray(draft.documents)
      ? draft.documents
      : [];

  // -----------------------------------------
  // Submit final case
  // -----------------------------------------

  const handleSubmit = async () => {
    if (!confirmed || submitting) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await addCase({
        title:
          draft.title ||
          'Untitled Case',

        incidentDate:
          draft.date || '',

        time:
          draft.time || '',

        location:
          draft.location || '',

        category:
          draft.category || '',

        description:
          draft.description || '',

        people,

        evidence:
          draft.evidence || null,

        documents,
      });

      // Clear server-side draft only
      // after successful case creation.
      await clearDraft();

      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit. Please try again.'
      );

      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1080px] space-y-4 pb-10">

      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Case Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage, track, and review active First Information Reports and
          Complaints.
        </p>
      </div>

      {/* STEPPER */}

      <Stepper currentStep={5} />

      {/* REVIEW HEADER */}

      <div className="pt-1">
        <h2 className="text-lg font-bold text-slate-900">
          Review & Submit
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Review everything carefully before submitting. You can edit any
          section below.
        </p>
      </div>

      {/* ========================================= */}
      {/* INCIDENT DETAILS */}
      {/* ========================================= */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">

          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-slate-700" />

            <h3 className="text-sm font-semibold text-slate-900">
              Incident Details
            </h3>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step1')
            }
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>

        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-4 px-5 py-4 md:grid-cols-2">

          {/* TITLE */}

          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              Title
            </p>

            <p className="mt-1 text-sm text-slate-900">
              {draft.title || 'Not provided'}
            </p>
          </div>

          {/* DATE + TIME */}

          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              Date & Time
            </p>

            <p className="mt-1 text-sm text-slate-900">
              {draft.date || 'Not provided'}

              {draft.time
                ? `, ${draft.time}`
                : ''}
            </p>
          </div>

          {/* LOCATION */}

          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold text-slate-500">
              Location
            </p>

            <p className="mt-1 text-sm text-slate-900">
              {draft.location || 'Not provided'}
            </p>
          </div>

          {/* CATEGORY */}

          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              Category
            </p>

            <p className="mt-1 text-sm text-slate-900">
              {draft.category || 'Not provided'}
            </p>
          </div>

          {/* DESCRIPTION */}

          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold text-slate-500">
              Description
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-700">
              {draft.description || 'Not provided'}
            </p>
          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* PEOPLE INVOLVED */}
      {/* ========================================= */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-700" />

            <h3 className="text-sm font-semibold text-slate-900">
              People Involved
            </h3>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step2')
            }
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>

        </div>

        <div className="space-y-2 px-5 py-4">

          {people.length === 0 ? (
            <p className="text-sm text-slate-500">
              No people added.
            </p>
          ) : (
            people.map(
              (person: any, index: number) => (
                <div
                  key={
                    person.id || index
                  }
                  className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                >

                  <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-slate-900">
                      {person.name ||
                        'Unknown Individual'}
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {person.relationship ||
                        'Person involved'}
                    </p>

                    {(person.contact ||
                      person.address) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {person.contact}

                        {person.contact &&
                        person.address
                          ? ' • '
                          : ''}

                        {person.address}
                      </p>
                    )}

                  </div>
                </div>
              )
            )
          )}

        </div>
      </section>

      {/* ========================================= */}
      {/* EVIDENCE DETAILS */}
      {/* ========================================= */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">

          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-slate-700" />

            <h3 className="text-sm font-semibold text-slate-900">
              Evidence Details
            </h3>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step4?stage=3')
            }
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>

        </div>

        <div className="px-5 py-4">

          {!evidence.evidenceType &&
          !evidence.evidenceTitle &&
          !evidence.description ? (
            <p className="text-sm text-slate-500">
              No evidence added.
            </p>
          ) : (
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">

              <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <Image className="h-4 w-4" />
              </div>

              <div className="min-w-0">

                <p className="text-sm font-semibold text-slate-900">
                  {evidence.evidenceTitle ||
                    'Evidence Item'}
                </p>

                <p className="mt-0.5 text-sm text-slate-500">
                  {evidence.evidenceType ||
                    'Evidence'}

                  {evidence.sourceLocation
                    ? ` • ${evidence.sourceLocation}`
                    : ''}
                </p>

              </div>
            </div>
          )}

        </div>
      </section>

      {/* ========================================= */}
      {/* SUPPORTING DOCUMENTS */}
      {/* ========================================= */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-700" />

            <h3 className="text-sm font-semibold text-slate-900">
              Supporting Documents
            </h3>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step4?stage=4')
            }
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>

        </div>

        <div className="space-y-2 px-5 py-4">

          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No documents uploaded.
            </p>
          ) : (
            documents.map(
              (doc: any, index: number) => (
                <div
                  key={
                    doc.id || index
                  }
                  className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                >

                  <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-slate-900">
                      {doc.name ||
                        'Unnamed Document'}
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {doc.type ||
                        'Document'}

                      {doc.size
                        ? ` • ${doc.size}`
                        : ''}
                    </p>

                  </div>
                </div>
              )
            )
          )}

        </div>
      </section>

      {/* ========================================= */}
      {/* ERROR */}
      {/* ========================================= */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ========================================= */}
      {/* CONFIRM + SUBMIT */}
      {/* ========================================= */}

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

        <label className="flex cursor-pointer items-start gap-3 border-b border-slate-200 pb-4">

          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) =>
              setConfirmed(
                e.target.checked
              )
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />

          <span className="text-sm leading-5 text-slate-600">
            I confirm that the information provided above is true and
            accurate to the best of my knowledge. I understand that
            submitting false information may carry legal consequences.
          </span>

        </label>

        {/* BOTTOM ACTIONS */}

        <div className="mt-4 flex items-center justify-between">

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step4?stage=4')
            }
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !confirmed ||
              submitting
            }
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? 'Submitting...'
              : 'Submit FIR / Complaint'}

            {!submitting && (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
          </button>

        </div>
      </section>

    </div>
  );
}
