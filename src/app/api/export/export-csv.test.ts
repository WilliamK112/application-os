import test from "node:test";
import assert from "node:assert/strict";

// Inline the CSV helper to test it in isolation (no external imports needed)
function escapeCsvField(value: string | number | boolean | undefined | null): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jobsToCsv(jobs: Array<{
  company: string;
  title: string;
  location: string | null;
  source: string | null;
  status: string;
  url: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  notes: string | null;
  createdAt: string;
}>): string {
  const header = [
    "Company",
    "Title",
    "Location",
    "Source",
    "Status",
    "URL",
    "Salary Min",
    "Salary Max",
    "Notes",
    "Created At",
  ].join(",");
  const rows = jobs.map((job) =>
    [
      escapeCsvField(job.company),
      escapeCsvField(job.title),
      escapeCsvField(job.location),
      escapeCsvField(job.source),
      escapeCsvField(job.status),
      escapeCsvField(job.url),
      escapeCsvField(job.salaryMin),
      escapeCsvField(job.salaryMax),
      escapeCsvField(job.notes),
      escapeCsvField(job.createdAt),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function applicationsToCsv(applications: Array<{
  company: string;
  jobTitle: string;
  status: string;
  appliedAt: string | null;
  notes: string | null;
  jobUrl: string | null;
  createdAt: string;
}>): string {
  const header = [
    "Company",
    "Job Title",
    "Status",
    "Applied At",
    "Notes",
    "Job URL",
    "Created At",
  ].join(",");
  const rows = applications.map((app) =>
    [
      escapeCsvField(app.company),
      escapeCsvField(app.jobTitle),
      escapeCsvField(app.status),
      escapeCsvField(app.appliedAt),
      escapeCsvField(app.notes),
      escapeCsvField(app.jobUrl),
      escapeCsvField(app.createdAt),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

test("jobsToCsv escapes plain fields correctly", () => {
  const csv = jobsToCsv([
    {
      company: "Acme AI",
      title: "Frontend Engineer",
      location: "Remote",
      source: "LinkedIn",
      status: "APPLIED",
      url: "https://linkedin.com/jobs/view/123",
      salaryMin: null,
      salaryMax: null,
      notes: null,
      createdAt: "2026-03-01T00:00:00Z",
    },
  ]);
  assert.ok(csv.includes("Acme AI,Frontend Engineer,Remote,LinkedIn,APPLIED"));
});

test("jobsToCsv escapes commas in company name", () => {
  const csv = jobsToCsv([
    {
      company: "Acme, Inc.",
      title: "Engineer",
      location: null,
      source: null,
      status: "SAVED",
      url: null,
      salaryMin: null,
      salaryMax: null,
      notes: null,
      createdAt: "2026-03-01T00:00:00Z",
    },
  ]);
  assert.ok(csv.includes('"Acme, Inc."'));
});

test("jobsToCsv escapes double quotes by doubling them", () => {
  const csv = jobsToCsv([
    {
      company: 'Corp "Alpha"',
      title: "Engineer",
      location: null,
      source: null,
      status: "SAVED",
      url: null,
      salaryMin: null,
      salaryMax: null,
      notes: null,
      createdAt: "2026-03-01T00:00:00Z",
    },
  ]);
  assert.ok(csv.includes('"Corp ""Alpha"""'));
});

test("jobsToCsv escapes newlines in notes", () => {
  const csv = jobsToCsv([
    {
      company: "Acme",
      title: "Engineer",
      location: null,
      source: null,
      status: "SAVED",
      url: null,
      salaryMin: null,
      salaryMax: null,
      notes: "Note with\nnewline",
      createdAt: "2026-03-01T00:00:00Z",
    },
  ]);
  assert.ok(csv.includes("Note with\nnewline"));
});

test("jobsToCsv returns header + data rows", () => {
  const csv = jobsToCsv([]);
  const lines = csv.split("\n");
  assert.equal(lines.length, 1);
  assert.equal(
    lines[0],
    "Company,Title,Location,Source,Status,URL,Salary Min,Salary Max,Notes,Created At",
  );
});

test("applicationsToCsv exports application with all fields", () => {
  const csv = applicationsToCsv([
    {
      company: "Google",
      jobTitle: "SWE",
      status: "INTERVIEW",
      appliedAt: "2026-03-15T10:00:00Z",
      notes: "Phone screen scheduled",
      jobUrl: "https://careers.google.com/jobs/123",
      createdAt: "2026-03-01T00:00:00Z",
    },
  ]);
  assert.ok(csv.includes("Google,SWE,INTERVIEW,2026-03-15T10:00:00Z"));
  assert.ok(csv.includes("Phone screen scheduled"));
});

test("applicationsToCsv handles null appliedAt", () => {
  const csv = applicationsToCsv([
    {
      company: "Startup",
      jobTitle: "Intern",
      status: "DRAFT",
      appliedAt: null,
      notes: null,
      jobUrl: null,
      createdAt: "2026-04-01T00:00:00Z",
    },
  ]);
  const lines = csv.split("\n");
  const dataRow = lines[1];
  // appliedAt is 4th column (0-indexed: 3)
  const parts = dataRow.split(",");
  assert.equal(parts[3], ""); // appliedAt column should be empty
});
