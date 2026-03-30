import { prisma } from "../src/lib/db/prisma";
import { applicationOsService } from "../src/lib/services/application-os-service";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "candidate@example.com" },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error("Seed user missing: candidate@example.com");
  }

  const stamp = Date.now();
  const job = await applicationOsService.createJob(user.id, {
    company: `Smoke Co ${stamp}`,
    title: "QA Engineer",
    location: "Remote",
    source: "smoke",
    url: `https://example.com/smoke/${stamp}`,
    notes: "heartbeat smoke",
  });

  const application = await applicationOsService.createApplication(user.id, {
    jobId: job.id,
    status: "APPLIED",
    appliedAt: new Date().toISOString(),
    notes: "smoke application",
  });

  const updated = await applicationOsService.updateApplicationStatus(user.id, {
    applicationId: application.application.id,
    status: "INTERVIEW",
  });

  console.log(
    JSON.stringify(
      {
        user: user.email,
        jobId: job.id,
        applicationId: application.application.id,
        applicationStatus: updated.application.status,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
