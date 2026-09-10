'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export default function AuditTrailRedirect() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u?.role || 'User');
        if (u?.role === 'Admin') {
          setIsAdmin(true);
          router.replace('/admin?tab=audit');
          return;
        }
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span>Verifying Audit Clearance...</span>
        </div>
      </div>
    );
  }

  // If not Admin, show Access Denied 403 Guard
  return (
    <div className="flex min-h-[75vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-900">
          403 - Administrator Clearance Required
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The Audit Trail is strictly confidential and restricted to authorized system administrators.
          Your current account role (<span className="font-semibold text-red-600">{userRole}</span>) is not permitted to view audit event history.
        </p>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 font-mono">
          Direct URL Access Blocked: /audit-trail
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
