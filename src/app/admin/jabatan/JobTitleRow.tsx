"use client";

import { useState, useTransition } from "react";
import type { JobTitle } from "@/types/database";
import { updateJobTitle, deleteJobTitle } from "./actions";

export function JobTitleRow({ jobTitle }: { jobTitle: JobTitle }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(jobTitle.name);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateJobTitle(jobTitle.id, name);
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteJobTitle(jobTitle.id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-gray-100">
        <td className="py-2 pr-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2 pr-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="rounded-md bg-brand-red px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Simpan
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setEditing(false)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
            >
              Batal
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-3 text-sm text-gray-900">{jobTitle.name}</td>
      <td className="py-2 pr-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-brand-navy hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
