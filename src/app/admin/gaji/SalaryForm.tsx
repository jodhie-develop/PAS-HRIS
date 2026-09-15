"use client";

import { useActionState } from "react";
import type { JobTitle } from "@/types/database";
import { createSalary, type SalaryActionState } from "./actions";

const initialState: SalaryActionState = { error: null, success: false };

export function SalaryForm({ jobTitles }: { jobTitles: JobTitle[] }) {
  const [state, formAction, isPending] = useActionState(createSalary, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Gaji per Jabatan</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="job_title_id" className="block text-sm font-medium text-gray-700">
            Jabatan
          </label>
          <select
            id="job_title_id"
            name="job_title_id"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Pilih jabatan</option>
            {jobTitles.map((jobTitle) => (
              <option key={jobTitle.id} value={jobTitle.id}>
                {jobTitle.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="base_salary" className="block text-sm font-medium text-gray-700">
            Gaji Pokok (Rp)
          </label>
          <input
            id="base_salary"
            name="base_salary"
            type="number"
            min={0}
            step={1000}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Catatan (opsional)
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="Grade, tunjangan, dll"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {jobTitles.length === 0 && (
        <p className="text-sm text-amber-700">
          Belum ada jabatan. Tambahkan jabatan dulu di Master Jabatan sebelum mengatur gaji.
        </p>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Data gaji berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={isPending || jobTitles.length === 0}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Tambah Gaji"}
      </button>
    </form>
  );
}
