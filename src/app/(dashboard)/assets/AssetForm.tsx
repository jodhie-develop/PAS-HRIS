"use client";

import { useActionState } from "react";
import { createAsset, type AssetFormState } from "./actions";
import type { Profile } from "@/types/database";

const initialState: AssetFormState = { error: null, success: false };

export function AssetForm({ employees }: { employees: Profile[] }) {
  const [state, formAction, isPending] = useActionState(createAsset, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="asset_name" className="block text-sm font-medium text-gray-700">
          Nama Aset
        </label>
        <input
          id="asset_name"
          name="asset_name"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="asset_code" className="block text-sm font-medium text-gray-700">
            Kode Aset
          </label>
          <input
            id="asset_code"
            name="asset_code"
            type="text"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <input
            id="status"
            name="status"
            type="text"
            placeholder="Tersedia"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
          Ditugaskan ke
        </label>
        <select
          id="assigned_to"
          name="assigned_to"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tidak ditugaskan</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name} ({employee.nik})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Catatan
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Aset berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Aset"}
      </button>
    </form>
  );
}
