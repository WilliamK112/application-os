"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { filterJobs, sortJobs, paginateJobs } from "@/lib/jobs/filters";
import { JOB_STATUS_OPTIONS } from "@/lib/constants/status";
import { updateJobStatusAction } from "./actions";
import type { Company, Job } from "@/types/domain";

export function JobsClient({ jobs, companies }: { jobs: Job[]; companies: Company[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sortField = (searchParams.get("sort") ?? "updatedAt") as "updatedAt" | "createdAt" | "company" | "title";
  const sortDir = (searchParams.get("dir") ?? "desc") as "asc" | "desc";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const view = (searchParams.get("view") ?? "table") as "table" | "grouped";

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
        <div className="flex gap-1">
          <button
            onClick={() => updateParam("view", "table")}
            className={`rounded px-2 py-1 text-xs ${view === "table" ? "bg-slate-800 text-white" : "border border-slate-300 text-slate-600"}`}
          >
            Table
          </button>
          <button
            onClick={() => updateParam("view", "grouped")}
            className={`rounded px-2 py-1 text-xs ${view === "grouped" ? "bg-slate-800 text-white" : "border border-slate-300 text-slate-600"}`}
          >
            By Company
          </button>
        </div>
      </div>

      {view === "grouped" ? (
        /* Grouped by company */
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No jobs match your filters.
            </div>
          ) : (
            (() => {
              const grouped = new Map<string, Job[]>();
              for (const job of filtered) {
                const key = job.company;
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(job);
              }
              const sortedCompanies = [...grouped.entries()].sort(([a], [b]) =>
                sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a),
              );
              return sortedCompanies.map(([companyName, companyJobs]) => (
                <div key={companyName} className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{companyName}</h3>
                      {companyJobs[0].companyId && companyMap[companyJobs[0].companyId] && (
                        <Link
                          href={`/companies/${companyJobs[0].companyId}`}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          🏢 View
                        </Link>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {companyJobs.length} job{companyJobs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {companyJobs.map((job) => (
                      <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-slate-500">
                            {job.location ?? "—"} · {job.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.url && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                            >
                              🔗 Apply
                            </a>
                          )}
                          <form action={updateJobStatusAction} className="flex gap-1">
                            <input type="hidden" name="jobId" value={job.id} />
                            <select
                              name="status"
                              defaultValue={job.status}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                            >
                              {JOB_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button type="submit" className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100">
                              Save
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      ) : (
        /* Table view */
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
                  <td className="px-4 py-3">
                    <span className="font-medium">{job.company}</span>
                    {job.companyId && companyMap[job.companyId] && (
                      <Link
                        href={`/companies/${job.companyId}`}
                        className="ml-2 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                        title={companyMap[job.companyId].name}
                      >
                        🏢
                      </Link>
                    )}
                  </td>
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
      )}

      {/* Pagination — only for table view */}
      {view === "table" && paginated.totalPages > 1 && (
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