"use server";

import { revalidatePath } from "next/cache";
import { applicationOsService } from "@/lib/services/application-os-service";
import { getCurrentUserOrThrow } from "@/lib/auth/session";

export async function createCompanyAction(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const name = formData.get("name") as string;
  const website = (formData.get("website") as string) || undefined;
  const industry = (formData.get("industry") as string) || undefined;
  const size = (formData.get("size") as string) || undefined;
  const location = (formData.get("location") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  await applicationOsService.createCompany(user.id, {
    name,
    website,
    industry,
    size,
    location,
    notes,
  });

  revalidatePath("/companies");
}

export async function updateCompanyAction(companyId: string, formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const name = (formData.get("name") as string) || undefined;
  const website = (formData.get("website") as string) || undefined;
  const industry = (formData.get("industry") as string) || undefined;
  const size = (formData.get("size") as string) || undefined;
  const location = (formData.get("location") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  await applicationOsService.updateCompany(user.id, companyId, {
    name,
    website,
    industry,
    size,
    location,
    notes,
  });

  revalidatePath("/companies");
}

export async function deleteCompanyAction(companyId: string) {
  const user = await getCurrentUserOrThrow();
  await applicationOsService.deleteCompany(user.id, companyId);
  revalidatePath("/companies");
}
