"use client";

import { useState, useRef } from "react";
import { createDocumentWithUploadAction, getUploadUrlAction } from "./actions";
import type { Document } from "@/types/domain";

const DOC_TYPE_LABELS: Record<string, string> = {
  RESUME: "Resume",
  COVER_LETTER: "Cover Letter",
  PORTFOLIO: "Portfolio",
  OTHER: "Other",
};

export function DocumentsClient({
  documents,
}: {
  documents: Document[];
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploading(true);

    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const type = (form.elements.namedItem("type") as HTMLSelectElement)?.value;
    const version = (form.elements.namedItem("version") as HTMLInputElement)?.value;
    const tags = (form.elements.namedItem("tags") as HTMLInputElement)?.value;
    const isDefault = (form.elements.namedItem("isDefault") as HTMLInputElement)?.checked;

    if (!file) {
      setError("Please select a file.");
      setUploading(false);
      return;
    }

    // Get presigned URL
    const credsResult = await getUploadUrlAction(file.name, file.type);
    if ("error" in credsResult) {
      setError(credsResult.error);
      setUploading(false);
      return;
    }

    // Upload file directly to S3
    const uploadRes = await fetch(credsResult.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      setError(`Upload failed: ${uploadRes.statusText}`);
      setUploading(false);
      return;
    }

    // Create document record
    const fd = new FormData();
    fd.set("name", name || file.name);
    fd.set("type", type);
    if (version) fd.set("version", version);
    if (tags) fd.set("tags", tags);
    fd.set("isDefault", String(isDefault ?? false));
    fd.set("uploadUrl", credsResult.uploadUrl);
    fd.set("publicUrl", credsResult.publicUrl);
    fd.set("key", credsResult.key);

    const result = await createDocumentWithUploadAction(fd);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Document uploaded! Refreshing...");
      form.reset();
      setShowUpload(false);
      // Force page refresh to show new document
      window.location.reload();
    }

    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showUpload ? "✕ Cancel" : "+ Upload Document"}
        </button>
      </div>

      {showUpload && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 font-semibold">Upload Document</h3>
          <p className="mb-3 text-xs text-slate-600">
            Supported: PDF, DOC, DOCX, TXT, PNG, JPG — max ~10MB.
          </p>
          <form ref={formRef} onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">File *</label>
              <input type="file" name="file" required className="mt-1 w-full text-sm" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Auto-filled from filename"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select
                  name="type"
                  defaultValue="RESUME"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="RESUME">Resume</option>
                  <option value="COVER_LETTER">Cover Letter</option>
                  <option value="PORTFOLIO">Portfolio</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Version</label>
                <input
                  type="text"
                  name="version"
                  placeholder="e.g. v1, 2024-Q1"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="frontend, react, senior"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDefault"
                id="isDefault"
                value="true"
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-700">
                Set as default for this type
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">No documents yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <h3 className="font-semibold">{doc.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                {doc.version && ` · ${doc.version}`}
                {doc.isDefault && (
                  <span className="ml-1 text-xs text-blue-600">★ default</span>
                )}
              </p>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-xs text-blue-600 hover:underline truncate"
                >
                  {doc.url}
                </a>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Tags: {doc.tags.join(", ") || "—"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}