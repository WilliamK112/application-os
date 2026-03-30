export type JobApplyProvider = "greenhouse" | "lever" | "workday" | "unknown";

export function detectJobApplyProvider(url: string | undefined): JobApplyProvider {
  if (!url) {
    return "unknown";
  }

  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("greenhouse.io") || host.includes("boards.greenhouse.io")) {
      return "greenhouse";
    }

    if (host.includes("lever.co") || host.includes("jobs.lever.co")) {
      return "lever";
    }

    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) {
      return "workday";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}
