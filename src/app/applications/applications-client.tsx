"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  filterApplications,
  sortApplications,
  paginateApplications,
} from "@/lib/jobs/filters";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status";
import { updateApplicationStatusAction } from "./actions";
import type { ApplicationWithJob } from "@/types/domain";

export function ApplicationsClient({ rows }: { rows: ApplicationWithJob[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sortField = (searchParams.get("sort") ?? "updatedAt") as
    | "updatedAt"
    | "createdAt"
    | "appliedAt"
    | "company"
    | "title";
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
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const filtered = filterApplications(rows, {
    status: status as ApplicationWithJob["application"]["status"] || undefined,
    search: search || undefined,
  });
  const sorted = sortApplications(filtered, { field: sortField, direction: sortDir });
  const paginated = paginateApplications(sorted, page, 20);

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
          {APPLICATION_STATUS_OPTIONS.map((s) => (
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
          <option value="appliedAt-desc">Most recently applied</option>
          <option value="appliedAt-asc">Oldest applied</option>
          <option value="company-asc">Company A-Z</option>
          <option value="company-desc">Company Z-A</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
        <span className="text-sm text-slate-500">
          {filtered.length} application{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {paginated.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            No applications match your filters.
          </div>
        ) : (
          paginated.items.map(({ application, job }) => (
            <article key={application.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">
                  {job.company} · {job.title}
                </h3>
                <form action={updateApplicationStatusAction}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <select
                    name="status"
                    defaultValue={application.status}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium"
                  >
                    {APPLICATION_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="submit" className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs">
                    Save
                  </button>
                </form>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Applied:{" "}
                {application.appliedAt
                  ? new Date(application.appliedAt).toLocaleDateString()
                  : "Not yet"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Last activity:{" "}
                {application.lastActivityAt
                  ? new Date(application.lastActivityAt).toLocaleString()
                  : "-"}
              </p>
            </article>
          ))
        )}
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