/**
 * Filter, sort, and pagination utilities for Jobs and Applications.
 * Used by the list pages and server actions.
 */

import type { Job, ApplicationWithJob } from "@/types/domain";

// ─── Job Filters & Sort ────────────────────────────────────────────────────

export type JobFilter = {
  status?: Job["status"];
  company?: string;
  source?: string;
  search?: string; // matches company or title
};

export type JobSortField = "updatedAt" | "createdAt" | "company" | "title";
export type SortDirection = "asc" | "desc";

export type JobSort = {
  field: JobSortField;
  direction: SortDirection;
};

export type JobListParams = {
  filter?: JobFilter;
  sort?: JobSort;
  page?: number;
  pageSize?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 20;

export function filterJobs(jobs: Job[], filter?: JobFilter): Job[] {
  if (!filter) return jobs;

  return jobs.filter((job) => {
    if (filter.status && job.status !== filter.status) return false;
    if (filter.company && !job.company.toLowerCase().includes(filter.company.toLowerCase())) return false;
    if (filter.source && job.source !== filter.source) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !job.company.toLowerCase().includes(q) &&
        !job.title.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

export function sortJobs(jobs: Job[], sort?: JobSort): Job[] {
  const { field = "updatedAt", direction = "desc" } = sort ?? {};

  return [...jobs].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "company":
        cmp = a.company.localeCompare(b.company);
        break;
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      case "createdAt":
        cmp = a.createdAt.localeCompare(b.createdAt);
        break;
      case "updatedAt":
      default:
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
}

export function paginateJobs<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const total = items.length;
  const totalPages = Math.ceil(total / safePageSize);
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

// ─── Application Filters & Sort ─────────────────────────────────────────────

export type ApplicationFilter = {
  status?: ApplicationWithJob["application"]["status"];
  jobId?: string;
  search?: string; // matches company or title
};

export type ApplicationSortField = "updatedAt" | "createdAt" | "appliedAt" | "company" | "title";
export type ApplicationSort = {
  field: ApplicationSortField;
  direction: SortDirection;
};

export type ApplicationListParams = {
  filter?: ApplicationFilter;
  sort?: ApplicationSort;
  page?: number;
  pageSize?: number;
};

export function filterApplications(
  apps: ApplicationWithJob[],
  filter?: ApplicationFilter,
): ApplicationWithJob[] {
  if (!filter) return apps;

  return apps.filter(({ application, job }) => {
    if (filter.status && application.status !== filter.status) return false;
    if (filter.jobId && application.jobId !== filter.jobId) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !job.company.toLowerCase().includes(q) &&
        !job.title.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

export function sortApplications(
  apps: ApplicationWithJob[],
  sort?: ApplicationSort,
): ApplicationWithJob[] {
  const { field = "updatedAt", direction = "desc" } = sort ?? {};

  return [...apps].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "company":
        cmp = a.job.company.localeCompare(b.job.company);
        break;
      case "title":
        cmp = a.job.title.localeCompare(b.job.title);
        break;
      case "appliedAt":
        cmp = (a.application.appliedAt ?? "").localeCompare(b.application.appliedAt ?? "");
        break;
      case "createdAt":
        cmp = a.application.createdAt.localeCompare(b.application.createdAt);
        break;
      case "updatedAt":
      default:
        cmp = a.application.updatedAt.localeCompare(b.application.updatedAt);
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
}

export function paginateApplications<T>(
  items: T[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  return paginateJobs(items, page, pageSize); // same logic
}
