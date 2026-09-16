"use client";

import { useActionState, useState } from "react";
import { createAsset, type AssetActionState } from "./actions";
import type { AssetType, OfficeLocation, Profile } from "@/types/database";

const initialState: AssetActionState = { error: null, success: false };

export function AssetForm({
  employees,
  officeLocations,
}: {
  employees: Profile[];
  officeLocations: OfficeLocation[];
}) {
  const [state, formAction, isPending] = useActionState(createAsset, initialState);
  const [assetType, setAssetType] = useState<AssetType>("barang");

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Aset</h2>

      <div>
        <label htmlFor="asset_type" className="block text-sm font-medium text-gray-700">
          Tipe Aset
        </label>
        <select
          id="asset_type"
          name="asset_type"
          value={assetType}
          onChange={(event) => setAssetType(event.target.value as AssetType)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-64"
        >
          <option value="barang">Barang</option>
          <option value="akun_digital">Akun Digital</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="asset_name" className="block text-sm font-medium text-gray-700">
            {assetType === "akun_digital" ? "Nama Akun" : "Nama Aset"}
          </label>
          <input
            id="asset_name"
            name="asset_name"
            type="text"
            required
            placeholder={assetType === "akun_digital" ? "Email Perusahaan - Marketing" : "Laptop Dell Latitude"}
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
            placeholder={assetType === "akun_digital" ? "Aktif" : "Tersedia"}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {assetType === "barang" ? (
        <div className="grid gap-3 sm:grid-cols-2">
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
            <label htmlFor="office_location_id" className="block text-sm font-medium text-gray-700">
              Lokasi Kantor
            </label>
            <select
              id="office_location_id"
              name="office_location_id"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Belum ditentukan</option>
              {officeLocations.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="digital_email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="digital_email"
              name="digital_email"
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="digital_phone" className="block text-sm font-medium text-gray-700">
              No. WhatsApp
            </label>
            <input
              id="digital_phone"
              name="digital_phone"
              type="text"
              placeholder="08123456789"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="digital_username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="digital_username"
              name="digital_username"
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="digital_password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="digital_password"
              name="digital_password"
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

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
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Tambah Aset"}
      </button>
    </form>
  );
}
