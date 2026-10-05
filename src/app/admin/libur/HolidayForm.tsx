"use client";

import { useActionState } from "react";
import { createHoliday, type HolidayActionState } from "./actions";

const initialState: HolidayActionState = { error: null, success: false };

export function HolidayForm() {
  const [state, formAction, isPending] = useActionState(createHoliday, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Hari Libur</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Tanggal
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Keterangan
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Hari Raya Idul Fitri / Cuti Bersama"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Hari libur berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Tambah Hari Libur"}
      </button>
    </form>
  );
}
