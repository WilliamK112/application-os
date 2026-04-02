import { NextResponse } from "next/server";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

export const dynamic = "force-dynamic";

function escapeCsvField(value: string | number | undefined | null): string {
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

export async function GET(request: Request) {
  try {
    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";

    const jobs = await applicationOsService.getJobs(session.user.id);

    if (format === "json") {
      return NextResponse.json({ jobs }, { status: 200 });
    }

    const csv = jobsToCsv(
      jobs.map((j) => ({
        company: j.company,
        title: j.title,
        location: j.location ?? null,
        source: j.source ?? null,
        status: j.status,
        url: j.url ?? null,
        salaryMin: j.salaryMin ?? null,
        salaryMax: j.salaryMax ?? null,
        notes: j.notes ?? null,
        createdAt: String(j.createdAt),
      })),
    );
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="jobs-${timestamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export/jobs]", err);
    return NextResponse.json({ error: "Failed to export jobs" }, { status: 500 });
  }
}
