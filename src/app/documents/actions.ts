"use server";

import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { generateUploadCredentials, isStorageConfigured } from "@/lib/storage/s3";
import type { DocumentType } from "@/types/domain";

const DOCUMENT_TYPE_OPTIONS = ["RESUME", "COVER_LETTER", "PORTFOLIO", "OTHER"] as const;

const createDocumentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(DOCUMENT_TYPE_OPTIONS),
  version: z.string().trim().max(50).optional(),
  tags: z.string().trim().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("").transform(() => undefined)),
  isDefault: z.boolean().default(false),
});

export type CreateDocumentActionState = {
  error: string;
  documentId?: string;
};

export async function createDocumentAction(
  _prevState: CreateDocumentActionState,
  formData: FormData,
): Promise<CreateDocumentActionState> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = createDocumentSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: formData.get("type") ?? "RESUME",
    version: formData.get("version") || undefined,
    tags: formData.get("tags") || undefined,
    url: formData.get("url") || undefined,
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (!parsed.data.url) {
    return { error: "URL is required. Upload a file or provide a URL." };
  }

  // Access repository directly for document creation (not yet in service)
  const { applicationOsRepository } = await import("@/lib/repositories/application-os-repository");
  const repository = applicationOsRepository as {
    createDocument(userId: string, input: {
      name: string;
      type: DocumentType;
      version?: string;
      url?: string;
      tags?: string[];
      isDefault?: boolean;
    }): Promise<{ id: string }>;
  };

  if (typeof repository.createDocument !== "function") {
    return { error: "Document creation is not available in the current repository mode." };
  }

  const doc = await repository.createDocument(user.id, {
    name: parsed.data.name,
    type: parsed.data.type as DocumentType,
    version: parsed.data.version,
    url: parsed.data.url,
    tags,
    isDefault: parsed.data.isDefault,
  });

  void authSession;
  return { error: "", documentId: doc.id };
}

export async function getUploadUrlAction(
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string } | { error: string }> {
  const user = await authSession.getCurrentUserOrThrow();

  if (!isStorageConfigured()) {
    return { error: "S3/R2 storage is not configured. Set APP_OS_S3_* env vars." };
  }

  const creds = await generateUploadCredentials(fileName, contentType, user.id);
  if (!creds) {
    return { error: "Failed to generate upload credentials." };
  }

  return {
    uploadUrl: creds.uploadUrl,
    publicUrl: creds.publicUrl,
    key: creds.key,
  };
}