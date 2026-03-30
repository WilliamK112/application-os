import test from "node:test";
import assert from "node:assert/strict";
import SettingsPage, { settingsPageAuth } from "@/app/settings/page";
import { applicationOsService } from "@/lib/services/application-os-service";

test("SettingsPage redirects to /login when user is unauthenticated", async () => {
  const originalGetCurrentUserOrThrow = settingsPageAuth.getCurrentUserOrThrow;
  const originalGetProfile = applicationOsService.getProfile.bind(applicationOsService);

  try {
    settingsPageAuth.getCurrentUserOrThrow = async () => {
      throw new Error("NEXT_REDIRECT");
    };

    let getProfileCalled = false;

    applicationOsService.getProfile = async () => {
      getProfileCalled = true;
      throw new Error("should not be called");
    };

    await assert.rejects(() => SettingsPage(), /NEXT_REDIRECT/);
    assert.equal(getProfileCalled, false);
  } finally {
    settingsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getProfile = originalGetProfile;
  }
});

test("SettingsPage loads profile scoped to authenticated user id", async () => {
  const originalGetCurrentUserOrThrow = settingsPageAuth.getCurrentUserOrThrow;
  const originalGetProfile = applicationOsService.getProfile.bind(applicationOsService);

  try {
    settingsPageAuth.getCurrentUserOrThrow = async () =>
      ({ id: "user-123", name: "Test User", email: "test@example.com" }) as never;

    let calledWithUserId: string | null = null;

    applicationOsService.getProfile = async (userId: string) => {
      calledWithUserId = userId;
      return null;
    };

    await SettingsPage();
    assert.equal(calledWithUserId, "user-123");
  } finally {
    settingsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getProfile = originalGetProfile;
  }
});
