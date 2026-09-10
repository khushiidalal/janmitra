"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";

function TwoFactorResultContent() {
  const searchParams = useSearchParams();

  const status = searchParams.get("status");

  const success = status === "success";

  let title = "Verification Failed";
  let message =
    "The verification link is invalid or has expired.";

  if (success) {
    title = "2FA Enabled Successfully";
    message =
      "Two-Factor Authentication is now active on your JANMITRA account.";
  } else if (status === "expired") {
    title = "Link Expired";
    message =
      "This verification link has expired. Return to Security Settings and request a new link.";
  } else if (status === "error") {
    title = "Something Went Wrong";
    message =
      "We could not complete the verification. Please try again.";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

        <div className="mb-5 flex justify-center">
          {success ? (
            <CheckCircle2 className="h-14 w-14 text-emerald-600" />
          ) : (
            <XCircle className="h-14 w-14 text-red-500" />
          )}
        </div>

        <div className="mb-3 flex items-center justify-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-600" />

          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            JANMITRA Security
          </span>
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <Link
          href="/settings"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return to JANMITRA
        </Link>
      </div>
    </main>
  );
}

export default function TwoFactorResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Loading...</div>}>
      <TwoFactorResultContent />
    </Suspense>
  );
}