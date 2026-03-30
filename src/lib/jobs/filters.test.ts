import test from "node:test";
import assert from "node:assert/strict";
import {
  filterJobs,
  sortJobs,
  paginateJobs,
  filterApplications,
  sortApplications,
  paginateApplications,
} from "./filters";
import type { Job, ApplicationWithJob } from "@/types/domain";

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: "job_1",
  userId: "user_1",
  company: "Acme",
  title: "Engineer",
  location: "Remote",
  source: "LinkedIn",
  salaryMin: 100000,
  salaryMax: 150000,
  status: "SAVED",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-15T00:00:00.000Z",
  ...overrides,
});

const makeApp = (overrides: Partial<ApplicationWithJob["application"]> = {}): ApplicationWithJob => ({
  application: {
    id: "app_1",
    userId: "user_1",
    jobId: "job_1",
    status: "APPLIED",
    appliedAt: "2026-03-05T00:00:00.000Z",
    lastActivityAt: "2026-03-10T00:00:00.000Z",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-15T00:00:00.000Z",
    ...overrides,
  },
  job: makeJob(),
});

// ─── filterJobs ───────────────────────────────────────────────────────────────

test("filterJobs returns all when no filter", () => {
  const jobs = [makeJob(), makeJob({ id: "job_2" })];
  assert.equal(filterJobs(jobs).length, 2);
});

test("filterJobs filters by status", () => {
  const jobs = [
    makeJob({ status: "SAVED" }),
    makeJob({ id: "job_2", status: "APPLIED" }),
  ];
  assert.equal(filterJobs(jobs, { status: "APPLIED" }).length, 1);
  assert.equal(filterJobs(jobs, { status: "SAVED" })[0].id, "job_1");
});

test("filterJobs filters by company (case-insensitive)", () => {
  const jobs = [
    makeJob({ company: "Acme" }),
    makeJob({ id: "job_2", company: "BlueCo" }),
  ];
  assert.equal(filterJobs(jobs, { company: "acme" }).length, 1);
  assert.equal(filterJobs(jobs, { company: "blueco" }).length, 1);
});

test("filterJobs filters by search (company + title)", () => {
  const jobs = [
    makeJob({ company: "Acme AI", title: "Frontend" }),
    makeJob({ id: "job_2", company: "BlueCo", title: "Backend Engineer" }),
  ];
  assert.equal(filterJobs(jobs, { search: "frontend" }).length, 1);
  assert.equal(filterJobs(jobs, { search: "acme" }).length, 1);
  // "engineer" matches job_2 (title "Backend Engineer"), not job_1 (title "Frontend")
  assert.equal(filterJobs(jobs, { search: "engineer" }).length, 1);
  assert.equal(filterJobs(jobs, { search: "engineer" })[0].id, "job_2");
});

// ─── sortJobs ─────────────────────────────────────────────────────────────────

test("sortJobs sorts by updatedAt desc by default", () => {
  const jobs = [
    makeJob({ id: "a", updatedAt: "2026-03-01T00:00:00.000Z" }),
    makeJob({ id: "b", updatedAt: "2026-03-20T00:00:00.000Z" }),
  ];
  const sorted = sortJobs(jobs);
  assert.equal(sorted[0].id, "b");
  assert.equal(sorted[1].id, "a");
});

test("sortJobs sorts asc when specified", () => {
  const jobs = [
    makeJob({ id: "a", updatedAt: "2026-03-01T00:00:00.000Z" }),
    makeJob({ id: "b", updatedAt: "2026-03-20T00:00:00.000Z" }),
  ];
  const sorted = sortJobs(jobs, { field: "updatedAt", direction: "asc" });
  assert.equal(sorted[0].id, "a");
});

test("sortJobs sorts by company", () => {
  const jobs = [
    makeJob({ id: "z", company: "Zeta" }),
    makeJob({ id: "a", company: "Alpha" }),
  ];
  const sorted = sortJobs(jobs, { field: "company", direction: "asc" });
  assert.equal(sorted[0].company, "Alpha");
});

// ─── paginateJobs ─────────────────────────────────────────────────────────────

test("paginateJobs returns correct page", () => {
  const jobs = Array.from({ length: 25 }, (_, i) => makeJob({ id: `job_${i}` }));
  const page1 = paginateJobs(jobs, 1, 10);
  assert.equal(page1.items.length, 10);
  assert.equal(page1.total, 25);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.page, 1);

  const page2 = paginateJobs(jobs, 2, 10);
  assert.equal(page2.items.length, 10);
  assert.equal(page2.page, 2);

  const page3 = paginateJobs(jobs, 3, 10);
  assert.equal(page3.items.length, 5);
  assert.equal(page3.page, 3);
});

test("paginateJobs handles page beyond range", () => {
  const jobs = [makeJob()];
  // Page 99 beyond range returns empty slice (start index beyond array)
  const result = paginateJobs(jobs, 99, 10);
  assert.equal(result.items.length, 0);
  assert.equal(result.page, 99);
  assert.equal(result.totalPages, 1);
});

// ─── filterApplications ───────────────────────────────────────────────────────

test("filterApplications filters by status", () => {
  const apps = [
    makeApp({ status: "APPLIED" }),
    makeApp({ id: "app_2", status: "INTERVIEW", jobId: "job_2" }),
  ];
  assert.equal(filterApplications(apps, { status: "INTERVIEW" }).length, 1);
});

test("filterApplications filters by search", () => {
  // Use stable job objects to avoid aliasing issues
  const job1 = makeJob({ id: "job_1", company: "Acme", title: "Frontend" });
  const job2 = makeJob({ id: "job_2", company: "BlueRocket", title: "Designer" });
  const apps: ApplicationWithJob[] = [
    { application: { ...makeApp().application, id: "app_1", jobId: "job_1" }, job: job1 },
    { application: { ...makeApp().application, id: "app_2", jobId: "job_2" }, job: job2 },
  ];
  assert.equal(filterApplications(apps, { search: "acme" }).length, 1);
  assert.equal(filterApplications(apps, { search: "blue" }).length, 1);
  assert.equal(filterApplications(apps, { search: "designer" }).length, 1);
});

// ─── sortApplications ─────────────────────────────────────────────────────────

test("sortApplications sorts by appliedAt", () => {
  const apps = [
    makeApp({ appliedAt: "2026-03-01T00:00:00.000Z" }),
    makeApp({ id: "app_2", appliedAt: "2026-03-20T00:00:00.000Z" }),
  ];
  const sorted = sortApplications(apps, { field: "appliedAt", direction: "asc" });
  assert.equal(sorted[0].application.id, "app_1");
});

// ─── paginateApplications ─────────────────────────────────────────────────────

test("paginateApplications same logic as paginateJobs", () => {
  const apps = Array.from({ length: 5 }, (_, i) => makeApp({ id: `app_${i}` }));
  const result = paginateApplications(apps, 1, 2);
  assert.equal(result.items.length, 2);
  assert.equal(result.total, 5);
  assert.equal(result.totalPages, 3);
});
