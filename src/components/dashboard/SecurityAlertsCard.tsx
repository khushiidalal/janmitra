'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import { getSecurityAlerts } from '@/lib/api';

export interface SecurityEvent {
  id?: string;
  _id?: string;
  time: string;
  type: string;
  text: string;
  accessedBy: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  status?: 'success' | 'failed';
  isUnusual?: boolean;
  unusualReason?: string;
  severity?: 'info' | 'warning' | 'critical';
}

function formatRelativeTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 minute ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;

  // Same day
  if (now.toDateString() === date.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function SecurityAlertsCard() {
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastEventIdsRef = useRef<string>('');

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getSecurityAlerts(5);
      if (Array.isArray(data)) {
        // Compute composite IDs to detect changes without unnecessary re-renders
        const currentIds = data.map((e: any) => e.id || e._id || `${e.time}-${e.accessedBy}`).join(',');
        if (currentIds !== lastEventIdsRef.current) {
          lastEventIdsRef.current = currentIds;
          setEvents(data);
        }
        setError(null);
      }
    } catch (err: any) {
      // Gracefully handle unauthenticated/unauthorized or network errors
      if (err?.status === 403) {
        setError('Restricted: Security monitoring requires Officer clearance.');
      } else if (err?.status === 401) {
        setError('Authentication required.');
      } else {
        // Retain existing events on transient errors
        console.error('Failed to poll security alerts:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Polling interval: 5 seconds for near-real-time updates without hammering the server
    const intervalId = setInterval(fetchAlerts, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchAlerts]);

  // Determine top status
  const hasUnusual = events.some((e) => e.isUnusual || e.status === 'failed' || e.severity === 'critical' || e.severity === 'warning');

  return (
    <Card
      className={`rounded-xl border p-4 shadow-sm transition-colors duration-300 ${
        hasUnusual ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/40'
      }`}
    >
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${hasUnusual ? 'text-red-600' : 'text-slate-800'}`}>
          {hasUnusual ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          ) : (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <h3 className="text-sm font-semibold">Security Alerts</h3>
        </div>

        {/* LIVE PULSING BADGE */}
        <div className="flex items-center gap-1.5" title="Real-time security monitoring active">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Live</span>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
          {error}
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && events.length === 0 && !error && (
        <div className="animate-pulse space-y-2">
          <div className="h-16 rounded-lg bg-slate-200/60" />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && events.length === 0 && !error && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
          <p className="mt-1 text-xs font-semibold text-slate-800">All Systems Secure</p>
          <p className="mt-0.5 text-[10px] text-slate-500">No unusual activity detected.</p>
        </div>
      )}

      {/* RECENT EVENTS LIST */}
      {events.length > 0 && (
        <div className="space-y-2.5">
          {events.slice(0, 2).map((event, idx) => {
            const isAlert = event.isUnusual || event.status === 'failed';
            const isFailed = event.status === 'failed';

            const deviceStr = [event.browser, event.operatingSystem, event.deviceType]
              .filter(Boolean)
              .join(' • ') || 'Unknown Device';

            return (
              <div
                key={event.id || event._id || `alert-${idx}`}
                className={`rounded-lg border p-3 bg-white transition shadow-xs ${
                  isAlert ? 'border-red-100' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    {isFailed ? (
                      <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    ) : isAlert ? (
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    )}

                    <h4
                      className={`text-xs font-semibold truncate max-w-[150px] ${
                        isAlert ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {isFailed
                        ? 'Failed Login Attempt'
                        : isAlert
                        ? 'Unusual Login'
                        : 'Successful Login'}
                    </h4>
                  </div>

                  <span className="text-[10px] text-slate-600 whitespace-nowrap">
                    {formatRelativeTime(event.time)}
                  </span>
                </div>

                <p className="mt-1 text-[11px] font-medium text-slate-800 truncate">
                  {event.accessedBy || event.userEmail || 'Unknown User'}
                  {event.userRole && (
                    <span className="ml-1 text-[10px] text-slate-600 font-normal">
                      ({event.userRole})
                    </span>
                  )}
                </p>

                {event.unusualReason && isAlert && (
                  <p className="mt-0.5 text-[10px] text-red-600 leading-tight">
                    {event.unusualReason}
                  </p>
                )}

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-600">
                  <span>
                    IP:{' '}
                    <span className="font-mono text-slate-700">
                      {event.ipAddress || 'Unknown'}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[170px]">{deviceStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REVIEW ACTIVITY BUTTON */}
      <button
        type="button"
        onClick={() => router.push('/audit-trail')}
        className={`mt-3 w-full rounded-md border px-3 py-1.5 text-[10px] font-medium transition active:scale-[0.99] ${
          hasUnusual
            ? 'border-red-300 text-red-600 hover:bg-red-50'
            : 'border-slate-300 text-slate-700 hover:bg-slate-100'
        }`}
      >
        Review Activity Log →
      </button>
    </Card>
  );
}
