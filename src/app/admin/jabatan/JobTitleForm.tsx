"use client";

import { useActionState } from "react";
import { createJobTitle, type JobTitleActionState } from "./actions";

const initialState: JobTitleActionState = { error: null, success: false };

export function JobTitleForm() {
  const [state, formAction, isPending] = useActionState(createJobTitle, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Jabatan</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nama Jabatan
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Staff Admin"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Tambah Jabatan"}
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Jabatan berhasil disimpan.</p>}
    </form>
  );
}
