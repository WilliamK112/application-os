import test from "node:test";
import assert from "node:assert/strict";
import DocumentsPage, { documentsPageAuth } from "@/app/documents/page";
import { applicationOsService } from "@/lib/services/application-os-service";

test("DocumentsPage redirects to /login when user is unauthenticated", async () => {
  const originalGetCurrentUserOrThrow = documentsPageAuth.getCurrentUserOrThrow;
  const originalGetDocuments = applicationOsService.getDocuments.bind(applicationOsService);

  try {
    documentsPageAuth.getCurrentUserOrThrow = async () => {
      throw new Error("NEXT_REDIRECT");
    };

    let getDocumentsCalled = false;

    applicationOsService.getDocuments = async () => {
      getDocumentsCalled = true;
      throw new Error("should not be called");
    };

    await assert.rejects(() => DocumentsPage(), /NEXT_REDIRECT/);
    assert.equal(getDocumentsCalled, false);
  } finally {
    documentsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getDocuments = originalGetDocuments;
  }
});

test("DocumentsPage loads documents scoped to authenticated user id", async () => {
  const originalGetCurrentUserOrThrow = documentsPageAuth.getCurrentUserOrThrow;
  const originalGetDocuments = applicationOsService.getDocuments.bind(applicationOsService);

  try {
    documentsPageAuth.getCurrentUserOrThrow = async () => ({ id: "user-123" }) as never;

    let calledWithUserId: string | null = null;

    applicationOsService.getDocuments = async (userId: string) => {
      calledWithUserId = userId;
      return [];
    };

    await DocumentsPage();
    assert.equal(calledWithUserId, "user-123");
  } finally {
    documentsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getDocuments = originalGetDocuments;
  }
});
