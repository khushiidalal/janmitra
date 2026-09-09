'use client';

import {
  FolderOpen,
  Hourglass,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Upload,
  KeyRound,
  FileCheck2,
  MoreVertical,
  Eye,
  UserRound,
} from 'lucide-react';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getCases, getDocuments } from '@/lib/api';

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

  useEffect(() => {
    getCases()
      .then((data) => {
        setAllCases(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setAllCases([]);
      });

    getDocuments()
      .then((data) => {
        if (Array.isArray(data)) {
          setDocumentCount(data.length);
        } else if (data && Array.isArray(data.documents)) {
          setDocumentCount(data.documents.length);
        } else if (data && typeof data.count === 'number') {
          setDocumentCount(data.count);
        } else {
          setDocumentCount(0);
        }
      })
      .catch(() => {
        setDocumentCount(0);
      });
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
      change: '20% from last month',
      changeType: 'up',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Pending Cases',
      value: pendingCount.toString().padStart(2, '0'),
      icon: Hourglass,
      change: '12% from last month',
      changeType: 'up',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Total Documents',
      value: documentCount.toString(),
      icon: FileText,
      change: 'Live from backend',
      changeType: 'up',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Pending Approvals',
      value: pendingCount.toString().padStart(2, '0'),
      icon: FileCheck2,
      change: '10% from last month',
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

  const activities = [
    {
      id: 1,
      text: 'New document uploaded in FIR-2023-089',
      date: '06/09/2026',
      time: '11:30 PM',
      icon: FileText,
      iconColor: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      id: 2,
      text: 'Case verification completed in FIR-2023-089',
      date: '06/09/2026',
      time: '11:30 PM',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      id: 3,
      text: 'Case moved to pending review',
      date: '06/09/2026',
      time: '11:30 PM',
      icon: Hourglass,
      iconColor: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      id: 4,
      text: 'Officer assigned to FIR-2023-089',
      date: '06/09/2026',
      time: '11:30 PM',
      icon: UserRound,
      iconColor: 'text-blue-500',
      bg: 'bg-blue-50',
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
                className={`mt-4 text-[11px] ${
                  stat.changeType === 'down'
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

            <div className="divide-y divide-slate-100">
              {activities.map((item) => {
                const ActivityIcon = item.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
                    >
                      <ActivityIcon
                        className={`h-4 w-4 ${item.iconColor}`}
                      />
                    </div>

                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                      {item.text}
                    </p>

                    <span className="hidden text-xs text-slate-500 md:block">
                      {item.date}
                    </span>

                    <span className="hidden text-xs text-slate-500 md:block">
                      {item.time}
                    </span>

                    <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
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
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/cases/${caseItem.id}`)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
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

          {/* SECURITY ALERT */}
          <Card className="rounded-xl border border-red-200 bg-red-50/30 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />

              <h3 className="text-sm font-semibold">
                Security Alerts
              </h3>
            </div>

            <div className="rounded-lg border border-red-100 bg-white p-3">
              <h4 className="text-xs font-semibold text-red-700">
                Unusual Login Attempt
              </h4>

              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                Detected from a new IP address on Oct 30, 02:45 AM.
                Review activity log.
              </p>

              <button className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-[10px] font-medium text-red-600 transition hover:bg-red-50">
                Review Activity
              </button>
            </div>
          </Card>

          {/* QUICK ACTION */}
          <Card className="rounded-xl border border-slate-200 p-0 shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-semibold text-blue-600">
                ⚡ Quick Action
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              <button
                onClick={() => router.push('/documents')}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Upload Document
                </span>
                <span>›</span>
              </button>

              <button className="flex w-full items-center justify-between px-4 py-3 text-left text-xs text-slate-700 hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-blue-500" />
                  Request Access
                </span>
                <span>›</span>
              </button>

              <button className="flex w-full items-center justify-between px-4 py-3 text-left text-xs text-slate-700 hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-blue-500" />
                  Verify Document
                </span>
                <span>›</span>
              </button>
            </div>
          </Card>

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
