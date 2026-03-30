/**
 * script/add-to-queue.ts
 * 直接通过 Prisma 将 Jobs 添加到 Auto-Apply Queue（绕过 UI）
 * 
 * 用法:
 *   npx tsx scripts/add-to-queue.ts <jobId> [provider]
 *   npx tsx scripts/add-to-queue.ts --list              # 列出可用职位
 *   npx tsx scripts/add-to-queue.ts --add-all-linkedin  # 把所有职位加入队列（provider=linkedin）
 *
 * 示例（添加单个职位）:
 *   npx tsx scripts/add-to-queue.ts cmna2upsu0000i33bd5u5rnhc_job_acme linkedin
 *
 * 示例（添加所有 QA/Engineer 相关职位）:
 *   npx tsx scripts/add-to-queue.ts --search Engineer
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = process.env.PRISMA_USER_ID ?? "cmnaqmcr30000i3ndm9lkg2ei"; // ckang53@wisc.edu

async function listJobs() {
  const jobs = await prisma.job.findMany({
    where: { userId: USER_ID },
    select: { id: true, title: true, companyId: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  console.log(`\n可用职位（共 ${jobs.length} 个）:`);
  jobs.forEach((j) => console.log(`  ${j.id}  —  ${j.title}`));
  return jobs;
}

async function addToQueue(jobIds: string[], provider = "linkedin") {
  if (jobIds.length === 0) {
    console.error("No job IDs provided");
    process.exit(1);
  }

  const items = await prisma.autoApplyQueueItem.createMany({
    data: jobIds.map((jobId) => ({
      userId: USER_ID,
      jobId,
      status: "PENDING",
      provider,
    })),
    skipDuplicates: true,
  });

  console.log(`\n✅ 成功添加 ${items.count} 个职位到 Auto-Apply Queue`);
  
  // 验证
  const queue = await prisma.autoApplyQueueItem.findMany({
    where: { userId: USER_ID },
    select: { id: true, status: true, provider: true, job: { select: { title: true } } },
  });
  console.log(`\n当前队列（共 ${queue.length} 项）:`);
  queue.forEach((q) => console.log(`  [${q.status}] ${q.provider} — ${q.job.title}`));
}

async function addAllLinkedIn() {
  const jobs = await prisma.job.findMany({
    where: { userId: USER_ID },
    select: { id: true },
  });
  await addToQueue(jobs.map((j) => j.id), "linkedin");
}

async function searchAndAdd(keyword: string, provider = "linkedin") {
  const jobs = await prisma.job.findMany({
    where: {
      userId: USER_ID,
      title: { contains: keyword, mode: "insensitive" },
    },
    select: { id: true, title: true },
  });
  if (jobs.length === 0) {
    console.log(`没有找到包含 "${keyword}" 的职位`);
    return;
  }
  console.log(`找到 ${jobs.length} 个职位:`);
  jobs.forEach((j) => console.log(`  ${j.id} — ${j.title}`));
  await addToQueue(jobs.map((j) => j.id), provider);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list") || args.length === 0) {
    await listJobs();
    return;
  }

  if (args.includes("--add-all-linkedin")) {
    await addAllLinkedIn();
    return;
  }

  if (args.includes("--search")) {
    const idx = args.indexOf("--search");
    const keyword = args[idx + 1] ?? "";
    const prov = args[idx + 2] ?? "linkedin";
    await searchAndAdd(keyword, prov);
    return;
  }

  // positional: jobId [provider]
  const jobId = args[0];
  const provider = args[1] ?? "linkedin";
  await addToQueue([jobId], provider);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
