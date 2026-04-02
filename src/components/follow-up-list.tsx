"use client";

import { useState } from "react";
import type { FollowUp } from "@/types/domain";
import { FollowUpItem } from "./follow-up-item";
import { CreateFollowUpForm } from "./create-follow-up-form";

interface FollowUpListProps {
  followUps: FollowUp[];
  applicationMap: Record<string, string>;
  userId: string;
}

export function FollowUpList({ followUps, applicationMap }: FollowUpListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedAppLabel, setSelectedAppLabel] = useState("");

  const pending = followUps.filter((f) => f.status === "PENDING");
  const completed = followUps.filter((f) => f.status !== "PENDING");

  const handleOpenCreate = () => {
    setShowCreateForm(true);
    setSelectedAppId("");
    setSelectedAppLabel("");
  };

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    setSelectedAppLabel(applicationMap[appId] ?? appId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pending Follow-ups</h2>
          <p className="text-sm text-slate-500">{pending.length} pending</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Follow-up
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Add Follow-up</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ✕ Cancel
            </button>
          </div>

          {!selectedAppId ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Select Application
              </label>
              <select
                onChange={(e) => handleAppSelect(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Choose an application...</option>
                {Object.entries(applicationMap).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-3 rounded-md bg-white p-2 text-sm text-slate-600">
              📋 {selectedAppLabel}
            </div>
          )}

          {selectedAppId && (
            <CreateFollowUpForm
              applicationId={selectedAppId}
              onSuccess={() => setShowCreateForm(false)}
            />
          )}
        </div>
      )}

      {pending.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No pending follow-ups. Click &quot;New Follow-up&quot; to create one.
        </p>
      )}

      <div className="space-y-3">
        {pending.map((followUp) => (
          <FollowUpItem
            key={followUp.id}
            followUp={followUp}
            applicationLabel={applicationMap[followUp.applicationId] ?? "Unknown Application"}
          />
        ))}
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-500">
            Completed / Skipped ({completed.length})
          </h3>
          <div className="space-y-3">
            {completed.map((followUp) => (
              <FollowUpItem
                key={followUp.id}
                followUp={followUp}
                applicationLabel={applicationMap[followUp.applicationId] ?? "Unknown Application"}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}