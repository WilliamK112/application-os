import { NextResponse } from "next/server";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

export const dynamic = "force-dynamic";

function escapeCsvField(value: string | number | boolean | undefined | null): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

export async function GET(request: Request) {
  try {
    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";

    const applicationsWithJobs =
      await applicationOsService.getApplications(session.user.id);

    if (format === "json") {
      return NextResponse.json({ applications: applicationsWithJobs }, { status: 200 });
    }

    const rows = applicationsWithJobs.map((aw) => ({
      company: aw.job.company,
      jobTitle: aw.job.title,
      status: aw.application.status,
      appliedAt: aw.application.appliedAt?.toISOString() ?? null,
      notes: aw.application.notes ?? null,
      jobUrl: aw.job.url ?? null,
      createdAt: aw.application.createdAt.toISOString(),
    }));

    const csv = applicationsToCsv(rows);
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="applications-${timestamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export/applications]", err);
    return NextResponse.json(
      { error: "Failed to export applications" },
      { status: 500 },
    );
  }
}
