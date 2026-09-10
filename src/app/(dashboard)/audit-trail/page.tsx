'use client';

import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "@/lib/api";

type AuditType = "document" | "review" | "login" | "approval";

type AuditItem = {
  time: string;
  type: AuditType;
  text: string;
  accessedBy: string;
};

type AuditGroup = {
  date: string;
  items: AuditItem[];
};

function ActivityIcon({ type }: { type: AuditType }) {
  if (type === "document") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-blue-500"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L18.5 9H15Z" />
      </svg>
    );
  }

  if (type === "review") {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-amber-500"
      >
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="M5.64 5.64l2.12 2.12" />
        <path d="m16.24 16.24 2.12 2.12" />
        <path d="m18.36 5.64-2.12 2.12" />
        <path d="m7.76 16.24-2.12 2.12" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    );
  }

  if (type === "login") {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-blue-500"
      >
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
      </svg>
    );
  }

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="text-emerald-500"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

export default function AuditTrail() {
  const [auditData, setAuditData] = useState<AuditGroup[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [dateRange, setDateRange] = useState("Last 30 days");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const logs = await getAuditLogs();

        const grouped: Record<string, AuditItem[]> = {};

        logs.forEach((log: any) => {
          const logDate = new Date(log.time);

          if (Number.isNaN(logDate.getTime())) {
            return;
          }

          const dateKey = logDate.toDateString();

          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }

          grouped[dateKey].push({
            time: logDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),

            type: log.type as AuditType,

            text: log.text,

            accessedBy:
              log.accessedBy ||
              log.userName ||
              log.user?.fullName ||
              "Unknown",
          });
        });

        const groups: AuditGroup[] = Object.entries(grouped)
          .map(([date, items]) => ({
            date,
            items,
          }))
          .sort((a, b) => {
            return (
              new Date(b.date).getTime() -
              new Date(a.date).getTime()
            );
          });

        setAuditData(groups);
      } catch (err: any) {
        console.error("Failed to load audit logs:", err);

        setError(
          err?.message || "Failed to load audit activities."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  

  const latestAuditDate = useMemo(() => {
    if (auditData.length === 0) {
      return new Date();
    }

    const dates = auditData
      .map((group) => new Date(group.date))
      .filter(
        (date) => !Number.isNaN(date.getTime())
      );

    if (dates.length === 0) {
      return new Date();
    }

    return new Date(
      Math.max(
        ...dates.map((date) => date.getTime())
      )
    );
  }, [auditData]);

  const filteredGroups = useMemo(() => {
    return auditData
      .filter((group) => {
        const groupDate = new Date(group.date);

        if (dateRange === "Today") {
          return (
            groupDate.toDateString() ===
            latestAuditDate.toDateString()
          );
        }

        if (dateRange === "Last 7 days") {
          const sevenDaysAgo =
            new Date(latestAuditDate);

          sevenDaysAgo.setDate(
            latestAuditDate.getDate() - 6
          );

          return (
            groupDate >= sevenDaysAgo &&
            groupDate <= latestAuditDate
          );
        }

        if (dateRange === "Last 30 days") {
          const thirtyDaysAgo =
            new Date(latestAuditDate);

          thirtyDaysAgo.setDate(
            latestAuditDate.getDate() - 29
          );

          return (
            groupDate >= thirtyDaysAgo &&
            groupDate <= latestAuditDate
          );
        }

        if (dateRange === "This month") {
          return (
            groupDate.getMonth() ===
              latestAuditDate.getMonth() &&
            groupDate.getFullYear() ===
              latestAuditDate.getFullYear()
          );
        }

        return true;
      })
      .map((group) => ({
        ...group,

        items: group.items
          .filter((item) => {
            const searchText =
              search.trim().toLowerCase();

            const matchesSearch =
              searchText === "" ||
              item.text
                .toLowerCase()
                .includes(searchText) ||
              item.time
                .toLowerCase()
                .includes(searchText) ||
              item.accessedBy
                .toLowerCase()
                .includes(searchText);

            const matchesStatus =
              status === "All Status" ||
              (status === "Uploaded" &&
                item.type === "document") ||
              (status === "Under Review" &&
                item.type === "review") ||
              (status === "Logged In" &&
                item.type === "login") ||
              (status === "Approved" &&
                item.type === "approval");

            return (
              matchesSearch &&
              matchesStatus
            );
          })
          .sort((a, b) => {
            return (
              new Date(
                `1970-01-01 ${b.time}`
              ).getTime() -
              new Date(
                `1970-01-01 ${a.time}`
              ).getTime()
            );
          }),
      }))
      .filter(
        (group) => group.items.length > 0
      );
  }, [
    auditData,
    search,
    status,
    dateRange,
    latestAuditDate,
  ]);

  

  return (
    <div className="min-h-full bg-[#f8fafc] px-7 py-6">

      {}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-gray-900">
            Audit Trail
          </h1>

          <p className="mt-2 text-[15px] text-gray-500">
            Manage, track, and review active First
            Information Reports and Complaints.
          </p>
        </div>

      </div>

      {}

      <div className="mb-6 flex min-h-[62px] items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 shadow-sm">

        {}

        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by Case ID, FIR, Title..."
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 text-[14px] text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
          />
        </div>

        {}

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          className="h-10 w-[135px] rounded-md border border-gray-200 bg-white px-3 text-[14px] text-gray-600 outline-none focus:border-blue-400"
        >
          <option>All Status</option>
          <option>Approved</option>
          <option>Under Review</option>
          <option>Uploaded</option>
          <option>Logged In</option>
        </select>

        {}

        <select
          value={dateRange}
          onChange={(e) =>
            setDateRange(e.target.value)
          }
          className="h-10 w-[145px] rounded-md border border-gray-200 bg-white px-3 text-[14px] text-gray-600 outline-none focus:border-blue-400"
        >
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Today</option>
          <option>This month</option>
        </select>

        {}

        <button
          type="button"
          title="Filter"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
          </svg>
        </button>
      </div>

      {}

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading audit activities...
          </p>
        </div>
      )}

      {}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-white py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-red-600">
            Failed to load audit activities
          </p>

          <p className="mt-2 text-sm text-gray-400">
            {error}
          </p>
        </div>
      )}

      {}

      {!loading && !error && (
        <div className="space-y-5">

          {filteredGroups.map((group) => (
            <section
              key={group.date}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >

              {}

              <div className="px-5 pb-3 pt-5">
                <h2 className="text-[16px] font-semibold text-gray-800">
                  {group.date}
                </h2>
              </div>

              {}

              <div className="flex items-center border-b border-gray-100 px-5 pb-2">

                <div className="w-[95px] shrink-0 text-[12px] font-semibold text-gray-500">
                  Time
                </div>

                <div className="flex-1 pl-[38px] text-[12px] font-semibold text-gray-500">
                  Activity
                </div>

                <div className="w-[220px] shrink-0 text-[12px] font-semibold text-gray-500">
                  Accessed By
                </div>

              </div>

              {}

              <div className="px-5 pb-4">

                {group.items.map(
                  (item, index) => (
                    <div
                      key={`${group.date}-${item.time}-${index}`}
                      className="flex min-h-[50px] items-center"
                    >

                      {}

                      <div className="w-[95px] shrink-0 text-[14px] text-gray-600">
                        {item.time}
                      </div>

                      {}

                      <div className="flex flex-1 items-center">

                        <div className="mr-4 flex w-[24px] shrink-0 items-center justify-center">
                          <ActivityIcon
                            type={item.type}
                          />
                        </div>

                        <div className="text-[15px] font-medium text-gray-700">
                          {item.text}
                        </div>

                      </div>

                      {}

                      <div className="w-[220px] shrink-0 text-[14px] font-medium text-gray-700">
                        {item.accessedBy}
                      </div>

                    </div>
                  )
                )}

              </div>
            </section>
          ))}

          {}

          {filteredGroups.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">

              <p className="text-lg font-medium text-gray-600">
                No audit activities found
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Try changing your search or status filter.
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
