"use client";

import { useState } from "react";
import type { Company } from "@/types/domain";
import {
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
} from "@/app/companies/actions";

interface CompanyListProps {
  companies: Company[];
  userId: string;
}

const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

function CompanyCard({ company }: { company: Company }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    await deleteCompanyAction(company.id);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {editing ? (
        <EditForm company={company} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{company.name}</h3>
              {company.industry && (
                <p className="text-sm text-slate-500">{company.industry}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ✏️ Edit
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  🗑️ Delete
                </button>
              ) : (
                <span className="flex items-center gap-1 text-sm">
                  <button
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-800"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
            {company.size && (
              <span className="rounded bg-slate-100 px-2 py-0.5">
                👥 {company.size}
              </span>
            )}
            {company.location && (
              <span className="rounded bg-slate-100 px-2 py-0.5">
                📍 {company.location}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-blue-50 px-2 py-0.5 text-blue-600 hover:underline"
              >
                🌐 Website
              </a>
            )}
          </div>
          {company.notes && (
            <p className="mt-2 text-sm text-slate-500">{company.notes}</p>
          )}
        </>
      )}
    </div>
  );
}

function EditForm({
  company,
  onCancel,
}: {
  company: Company;
  onCancel: () => void;
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateCompanyAction(company.id, formData);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="text-slate-600">Company Name</span>
        <input
          name="name"
          defaultValue={company.name}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-600">Industry</span>
          <input
            name="industry"
            defaultValue={company.industry ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. AI / SaaS / Fintech"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Company Size</span>
          <select
            name="size"
            defaultValue={company.size ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select size...</option>
            {COMPANY_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-600">Location</span>
          <input
            name="location"
            defaultValue={company.location ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. San Francisco, CA"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Website</span>
          <input
            name="website"
            type="url"
            defaultValue={company.website ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="https://..."
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-slate-600">Notes</span>
        <textarea
          name="notes"
          defaultValue={company.notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Contacts, culture, salary range..."
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CreateForm({ onCancel }: { onCancel: () => void }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createCompanyAction(formData);
    onCancel();
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Add Company</h3>
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ✕ Cancel
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="text-slate-600">Company Name *</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. Anthropic"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Industry</span>
            <input
              name="industry"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="e.g. AI / SaaS / Fintech"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Company Size</span>
            <select
              name="size"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Select size...</option>
              {COMPANY_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Location</span>
            <input
              name="location"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="e.g. San Francisco, CA"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Website</span>
            <input
              name="website"
              type="url"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="https://..."
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">Notes</span>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Contacts, culture, salary range..."
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Company
        </button>
      </form>
    </div>
  );
}

export function CompanyList({ companies }: CompanyListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">All Companies</h2>
          <p className="text-sm text-slate-500">
            {companies.length} company {companies.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreateForm ? "✕ Cancel" : "+ New Company"}
        </button>
      </div>

      {showCreateForm && <CreateForm onCancel={() => setShowCreateForm(false)} />}

      {companies.length === 0 && !showCreateForm ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No companies tracked yet.</p>
          <p className="text-sm text-slate-400">
            Add your first company to start tracking.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
