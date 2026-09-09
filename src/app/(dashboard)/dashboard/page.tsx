'use client';

import {
  FolderOpen,
  Hourglass,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileCheck2,
  Eye,
  UserRound,
} from 'lucide-react';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getCases, getDocuments, getCaseActivities } from '@/lib/api';
import SecurityAlertsCard from '@/components/dashboard/SecurityAlertsCard';


function latestTimestamp(values: unknown[]): string | null {
  const timestamps = values
    .map((value) => {
      const timestamp = new Date(String(value || '')).getTime();
      return Number.isNaN(timestamp) ? null : timestamp;
    })
    .filter((timestamp): timestamp is number => timestamp !== null);

  return timestamps.length > 0
    ? new Date(Math.max(...timestamps)).toISOString()
    : null;
}

function formatTimestamp(label: string, timestamp: string | null): string {
  if (!timestamp) {
    return `${label}: No data yet`;
  }

  return `${label}: ${new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
}

function formatActivityDateTime(timeInput: string | Date | undefined) {
  if (!timeInput) return { date: '—', time: '—' };
  const d = new Date(timeInput);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '—' };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date: dateStr, time: timeStr };
}

function getCaseActivityVisuals(activity: any) {
  const text = (activity?.text || '').toLowerCase();
  const type = activity?.type || '';

  // 1. Completed / Verified / Closed
  if (
    text.includes('verification') ||
    text.includes('completed') ||
    text.includes('verified') ||
    text.includes('closed')
  ) {
    return {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bg: 'bg-green-50',
    };
  }

  // 2. Pending review / Moved status / Review
  if (
    text.includes('pending') ||
    text.includes('moved') ||
    text.includes('review') ||
    type === 'review'
  ) {
    return {
      icon: Hourglass,
      iconColor: 'text-orange-500',
      bg: 'bg-orange-50',
    };
  }

  // 3. Officer / User assigned / Approval
  if (
    text.includes('officer') ||
    text.includes('assigned') ||
    text.includes('investigator') ||
    type === 'approval'
  ) {
    return {
      icon: UserRound,
      iconColor: 'text-blue-500',
      bg: 'bg-blue-50',
    };
  }

  // 4. Document uploaded / OCR / default
  return {
    icon: FileText,
    iconColor: 'text-blue-500',
    bg: 'bg-blue-50',
  };
}

export default function Dashboard() {
  const router = useRouter();

  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const stored = localStorage.getItem('userName');
    if (stored) {
      setUserName(stored);
    }
  }, []);

  const firstName = userName.split(' ')[0];

  const [allCases, setAllCases] = useState<any[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [lastActiveCaseUpdate, setLastActiveCaseUpdate] = useState<string | null>(null);
  const [lastPendingCaseUpdate, setLastPendingCaseUpdate] = useState<string | null>(null);
  const [lastDocumentUpload, setLastDocumentUpload] = useState<string | null>(null);
  const [lastPendingDocumentUpload, setLastPendingDocumentUpload] = useState<string | null>(null);

  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const lastActivityIdsRef = useRef<string>('');

  const fetchActivities = useCallback(async () => {
    try {
      const data = await getCaseActivities(6);
      if (Array.isArray(data)) {
        const currentIds = data
          .map((a: any) => a._id || a.id || `${a.time}-${a.text}`)
          .join(',');
        if (currentIds !== lastActivityIdsRef.current) {
          lastActivityIdsRef.current = currentIds;
          setActivities(data);
        }
        setActivityError(null);
      }
    } catch (err: any) {
      console.error('Failed to poll case activities:', err);
      if (err?.status === 401) {
        setActivityError('Authentication required.');
      } else {
        setActivityError('Failed to load recent activities.');
      }
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    const intervalId = setInterval(fetchActivities, 5000);
    return () => clearInterval(intervalId);
  }, [fetchActivities]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      const [casesResult, documentsResult] = await Promise.allSettled([
        getCases(),
        getDocuments(),
      ]);

      if (!isMounted) {
        return;
      }

      const cases =
        casesResult.status === 'fulfilled' && Array.isArray(casesResult.value)
          ? casesResult.value
          : [];
      setAllCases(cases);

      const activeCases = cases.filter((currentCase) => currentCase.status === 'Active');
      const pendingCases = cases.filter((currentCase) => currentCase.status === 'Pending');
      setLastActiveCaseUpdate(
        latestTimestamp(activeCases.map((currentCase) => currentCase.updatedAt))
      );
      setLastPendingCaseUpdate(
        latestTimestamp(pendingCases.map((currentCase) => currentCase.updatedAt))
      );

      const documentData =
        documentsResult.status === 'fulfilled' ? documentsResult.value : null;
      const standaloneDocuments = Array.isArray(documentData)
        ? documentData
        : documentData && Array.isArray(documentData.documents)
          ? documentData.documents
          : [];
      const standaloneDocumentCount = Array.isArray(documentData)
        ? documentData.length
        : documentData && Array.isArray(documentData.documents)
          ? documentData.documents.length
          : documentData && typeof documentData.count === 'number'
            ? documentData.count
            : 0;
      const caseDocumentCount = cases.reduce(
        (total, currentCase) =>
          total +
          (Array.isArray(currentCase.documents)
            ? currentCase.documents.length
            : 0),
        0
      );

      setDocumentCount(standaloneDocumentCount + caseDocumentCount);
      setLastDocumentUpload(
        latestTimestamp([
          ...standaloneDocuments.map((currentDocument: any) => currentDocument.createdAt),
          ...cases
            .filter((currentCase) => Array.isArray(currentCase.documents) && currentCase.documents.length > 0)
            .map((currentCase) => currentCase.updatedAt),
        ])
      );

      const pendingCaseIds = new Set(
        pendingCases.map((currentCase) => currentCase.id || currentCase.caseId)
      );
      setLastPendingDocumentUpload(
        latestTimestamp([
          ...standaloneDocuments
            .filter((currentDocument: any) => pendingCaseIds.has(currentDocument.caseId))
            .map((currentDocument: any) => currentDocument.createdAt),
          ...pendingCases
            .filter((currentCase) => Array.isArray(currentCase.documents) && currentCase.documents.length > 0)
            .map((currentCase) => currentCase.updatedAt),
        ])
      );
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadDashboardData();
      }
    };

    void loadDashboardData();
    const refreshInterval = window.setInterval(loadDashboardData, 5000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, []);

  const activeCount = allCases.filter(
    (c: any) => c.status === 'Active'
  ).length;

  const pendingCount = allCases.filter(
    (c: any) => c.status === 'Pending'
  ).length;

  const stats = [
    {
      label: 'Active Cases',
      value: activeCount.toString().padStart(2, '0'),
      icon: FolderOpen,
      change: formatTimestamp('Last updated', lastActiveCaseUpdate),
      changeType: 'up',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Pending Cases',
      value: pendingCount.toString().padStart(2, '0'),
      icon: Hourglass,
      change: formatTimestamp('Last updated', lastPendingCaseUpdate),
      changeType: 'up',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Total Documents',
      value: documentCount.toString(),
      icon: FileText,
      change: formatTimestamp('Last uploaded', lastDocumentUpload),
      changeType: 'up',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Pending Approvals',
      value: pendingCount.toString().padStart(2, '0'),
      icon: FileCheck2,
      change: formatTimestamp('Last updated', lastPendingDocumentUpload),
      changeType: 'down',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Requires Attention',
      value: '02',
      icon: AlertTriangle,
      change: 'Requires Attention',
      changeType: 'alert',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
  ];

  const recentCases = allCases.slice(0, 5);

  const fallbackCases = [
    {
      id: 'FIR-2023-089',
      title: 'Property Dispute - Sector 4',
      date: 'Oct 12, 2023',
      status: 'Active',
    },
    {
      id: 'CMP-2023-112',
      title: 'Noise Complaint - Nighttime',
      date: 'Oct 28, 2023',
      status: 'Pending',
    },
    {
      id: 'CMP-2023-113',
      title: 'Noise Complaint - Nighttime',
      date: 'Oct 28, 2023',
      status: 'Pending',
    },
    {
      id: 'CMP-2023-089',
      title: 'Property Dispute - Sector 14',
      date: 'Nov 12, 2023',
      status: 'Pending',
    },
    {
      id: 'CMP-2023-089-A',
      title: 'Property Dispute - Sector 14',
      date: 'Nov 12, 2023',
      status: 'Under review',
    },
  ];

  const tableCases =
    recentCases.length > 0 ? recentCases : fallbackCases;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* PAGE HEADING */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {firstName}. Here is an overview of your active cases
            and recent activity.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/cases/new')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          File New Complaint
        </motion.button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <motion.div
            key={`${stat.label}-${i}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="h-full rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {stat.label}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-950">
                    {stat.value}
                  </p>
                </div>
              </div>

              <p
                className={`mt-4 text-[11px] ${stat.changeType === 'down'
                    ? 'text-green-600'
                    : stat.changeType === 'alert'
                      ? 'text-red-500'
                      : 'text-blue-500'
                  }`}
              >
                {stat.changeType === 'up' && '↑ '}
                {stat.changeType === 'down' && '↓ '}
                {stat.change}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">

        {/* LEFT */}
        <div className="space-y-4">

          {/* CASE STATUS OVERVIEW */}
          <Card className="rounded-xl border border-slate-200 p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Case Status Overview
              </h3>

              <button
                onClick={() => router.push('/cases')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            {loadingActivities && activities.length === 0 ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 px-5 py-3"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100" />
                    <div className="h-4 flex-1 rounded bg-slate-100" />
                    <div className="hidden h-3 w-16 rounded bg-slate-100 md:block" />
                    <div className="hidden h-3 w-14 rounded bg-slate-100 md:block" />
                  </div>
                ))}
              </div>
            ) : activityError && activities.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-slate-500">
                <p>{activityError}</p>
                <button
                  onClick={() => fetchActivities()}
                  className="mt-2 font-medium text-blue-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FileText className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-medium text-slate-600">
                  No case activities recorded yet
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Activities will appear here when cases are registered, documents uploaded, or status updated.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.map((item, idx) => {
                  const visuals = getCaseActivityVisuals(item);
                  const ActivityIcon = visuals.icon;
                  const { date, time } = formatActivityDateTime(item.time);

                  return (
                    <div
                      key={item._id || item.id || idx}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/50"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visuals.bg}`}
                      >
                        <ActivityIcon
                          className={`h-4 w-4 ${visuals.iconColor}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {item.text}
                        </p>
                        {item.caseId && (
                          <p className="text-[11px] text-slate-400">
                            {item.caseId}
                            {item.accessedBy ? ` • by ${item.accessedBy}` : ''}
                          </p>
                        )}
                      </div>

                      <span className="hidden whitespace-nowrap text-xs text-slate-500 md:block">
                        {date}
                      </span>

                      <span className="hidden whitespace-nowrap text-xs text-slate-500 md:block">
                        {time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* MY CASES */}
          <Card className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                My Cases
              </h3>

              <button
                onClick={() => router.push('/cases')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View All Cases →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">
                      Case/FIR ID
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Title
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Incident Date
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tableCases.map((caseItem: any, i: number) => (
                    <motion.tr
                      key={`${caseItem.id}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                        {caseItem.id}
                      </td>

                      <td className="max-w-[220px] px-4 py-3 text-slate-700">
                        {caseItem.title}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {caseItem.date || caseItem.incidentDate || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <Badge status={caseItem.status as any} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              router.push(`/cases/${caseItem.id}`)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-3">

          {/* REAL-TIME SECURITY ALERTS */}
          <SecurityAlertsCard />


          {/* SYSTEM INTEGRITY */}
          <Card className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-blue-700">
              System Integrity
            </h3>

            <div className="mt-4 flex gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-blue-500" />

              <div>
                <p className="text-xs font-semibold text-slate-800">
                  All System Secure
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Last Scan: Just Now
                </p>
              </div>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[82%] rounded-full bg-blue-500" />
            </div>
          </Card>

          <div className="px-2 py-2 text-right">
            <p className="text-[9px] italic text-slate-500">
              “Justice is truth in action.”
            </p>

            <p className="mt-1 text-[9px] font-semibold text-blue-600">
              – Dr. B.R. Ambedkar
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
