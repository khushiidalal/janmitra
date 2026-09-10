'use client';

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  CalendarDays,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getCases } from "@/lib/api";

export default function CaseManagement() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);

        const data = await getCases();

        setCases(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load cases:", error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((caseItem: any) => {
      const title = caseItem?.title || "";
      const id = caseItem?.id || caseItem?._id || "";
      const status = caseItem?.status || "";
      const incidentDate =
        caseItem?.incidentDate || caseItem?.date || caseItem?.createdAt;

      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(id).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      let matchesDate = true;

      if (selectedDate && incidentDate) {
        const dateValue = new Date(incidentDate);

        if (!Number.isNaN(dateValue.getTime())) {
          matchesDate =
            dateValue.toISOString().split("T")[0] === selectedDate;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [cases, searchQuery, statusFilter, selectedDate]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All Status");
    setSelectedDate("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-gray-900">
            Case Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage, track, and review active First Information Reports and
            Complaints.
          </p>
        </div>

        <button
          onClick={() => router.push("/cases/new")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          File New Complaint
        </button>
      </div>

      {}
      <Card className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search by Case ID, FIR, Title ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {}
          <div className="min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Under review</option>
              <option>Closed</option>
            </select>
          </div>

          {}
          <div className="relative min-w-[175px]">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {}
          <button
            onClick={handleClearFilters}
            title="Clear filters"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Case/FIR ID
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Incident Date
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading cases...
                  </td>
                </tr>
              ) : paginatedCases.length > 0 ? (
                paginatedCases.map((caseItem: any, index: number) => {
                  const caseId =
                    caseItem?.id || caseItem?._id || `CASE-${index + 1}`;

                  const incidentDate =
                    caseItem?.incidentDate ||
                    caseItem?.date ||
                    caseItem?.createdAt;

                  return (
                    <tr
                      key={caseItem?._id || caseItem?.id || index}
                      className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">
                        {caseId}
                      </td>

                      <td className="max-w-[260px] px-5 py-3">
                        <div className="text-sm font-medium text-gray-800">
                          {caseItem?.title || "Untitled Case"}
                        </div>

                        {caseItem?.category && (
                          <div className="mt-0.5 text-xs text-gray-400">
                            {caseItem.category}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">
                        {formatDate(incidentDate)}
                      </td>

                      <td className="px-5 py-3">
                        <Badge status={(caseItem?.status || "Pending") as any} />
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => router.push(`/cases/${caseId}`)}
                            title="View case"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No cases match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {filteredCases.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-700">
              {Math.min(currentPage * itemsPerPage, filteredCases.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {filteredCases.length}
            </span>{" "}
            cases
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={totalPages === 0 || currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
