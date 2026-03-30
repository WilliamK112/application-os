import type { CreateJobInput } from "@/lib/repositories/application-os-repository";

export function parseJobUrlToDraft(urlString: string): CreateJobInput {
  const normalized = urlString.trim();
  const url = new URL(normalized);

  const hostParts = url.hostname.replace(/^www\./, "").split(".");
  const companyRaw = hostParts[0] ?? "Company";
  const company = companyRaw.charAt(0).toUpperCase() + companyRaw.slice(1);

  const pathParts = url.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter(Boolean)
    .filter((part) => !["jobs", "job", "careers", "positions"].includes(part.toLowerCase()));

  const titleSeed = pathParts[pathParts.length - 1] ?? "Job opening";
  const title = titleSeed
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

  return {
    company,
    title,
    source: url.hostname,
    url: normalized,
    status: "SAVED",
  };
}

function parseCsvRow(line: string): CreateJobInput | null {
  const cells = line.split(",").map((cell) => cell.trim());
  if (cells.length < 2) {
    return null;
  }

  const [company, title, location, source, url] = cells;
  if (!company || !title) {
    return null;
  }

  return {
    company,
    title,
    location: location || undefined,
    source: source || undefined,
    url: url || undefined,
    status: "SAVED",
  };
}

export function parseBulkJobImport(input: string): CreateJobInput[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));

  const jobs: CreateJobInput[] = [];

  for (const line of lines) {
    if (/^https?:\/\//i.test(line)) {
      try {
        jobs.push(parseJobUrlToDraft(line));
      } catch {
        // skip invalid URL lines
      }
      continue;
    }

    const row = parseCsvRow(line);
    if (row) {
      jobs.push(row);
    }
  }

  return jobs;
}
