"use server";

import { revalidatePath } from "next/cache";
import { applicationOsService } from "@/lib/services/application-os-service";
import { getCurrentUserOrThrow } from "@/lib/auth/session";

export async function deleteCompanyAction(companyId: string) {
  const user = await getCurrentUserOrThrow();
  await applicationOsService.deleteCompany(user.id, companyId);
  revalidatePath("/companies");
}
