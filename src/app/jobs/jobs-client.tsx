"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { filterJobs, sortJobs, paginateJobs } from "@/lib/jobs/filters";
import { JOB_STATUS_OPTIONS } from "@/lib/constants/status";
import { updateJobStatusAction } from "./actions";
import type { Job } from "@/types/domain";

export function JobsClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sortField = (searchParams.get("sort") ?? "updatedAt") as "updatedAt" | "createdAt" | "company" | "title";
  const sortDir = (searchParams.get("dir") ?? "desc") as "asc" | "desc";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1 on filter change
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Apply filter + sort + paginate
  const filtered = filterJobs(jobs, {
    status: status as Job["status"] || undefined,
    search: search || undefined,
  });
  const sorted = sortJobs(filtered, { field: sortField, direction: sortDir });
  const paginated = paginateJobs(sorted, page, 20);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search company or title..."
          defaultValue={search}
          onChange={(e) => updateParam("search", e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {JOB_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split("-") as [typeof sortField, typeof sortDir];
            updateParam("sort", field);
            updateParam("dir", dir);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="updatedAt-desc">Recently updated</option>
          <option value="updatedAt-asc">Oldest updated</option>
          <option value="createdAt-desc">Newest added</option>
          <option value="createdAt-asc">Oldest added</option>
          <option value="company-asc">Company A-Z</option>
          <option value="company-desc">Company Z-A</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
        <span className="text-sm text-slate-500">{filtered.length} job{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {paginated.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No jobs match your filters.
                </td>
              </tr>
            ) : (
              paginated.items.map((job) => (
                <tr key={job.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{job.company}</td>
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{job.location ?? "-"}</td>
                  <td className="px-4 py-3">
                    <form action={updateJobStatusAction}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <select
                        name="status"
                        defaultValue={job.status}
                        className="rounded-md border border-slate-300 px-2 py-1"
                      >
                        {JOB_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button type="submit" className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">{new Date(job.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                router.push(`?${params.toString()}`);
              }}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm"
            >
              ← Prev
            </button>
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {paginated.totalPages} · {paginated.total} total
          </span>
          {page < paginated.totalPages && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page + 1));
                router.push(`?${params.toString()}`);
              }}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}