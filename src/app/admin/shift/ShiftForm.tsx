"use client";

import { useActionState } from "react";
import { createShift, type ShiftActionState } from "./actions";

const initialState: ShiftActionState = { error: null, success: false };

export function ShiftForm() {
  const [state, formAction, isPending] = useActionState(createShift, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Shift</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="shift_name" className="block text-sm font-medium text-gray-700">
            Nama Shift
          </label>
          <input
            id="shift_name"
            name="shift_name"
            type="text"
            required
            placeholder="Shift Pagi"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
            Jam Mulai
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
            Jam Selesai
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Shift berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Tambah Shift"}
      </button>
    </form>
  );
}
