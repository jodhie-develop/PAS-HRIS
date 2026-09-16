"use client";

import { useActionState, useState, useTransition } from "react";
import { updateAsset, deleteAsset, type AssetActionState } from "./actions";
import { IconEye, IconEyeOff } from "@/components/icons";
import type { AssetType, CompanyAsset, OfficeLocation, Profile } from "@/types/database";

const initialState: AssetActionState = { error: null, success: false };

export function AssetCard({
  asset,
  employees,
  officeLocations,
}: {
  asset: CompanyAsset;
  employees: Profile[];
  officeLocations: OfficeLocation[];
}) {
  const [editing, setEditing] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>(asset.asset_type);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const updateWithId = updateAsset.bind(null, asset.id);
  const [state, formAction, isPending] = useActionState(updateWithId, initialState);

  const assignedEmployee = employees.find((employee) => employee.id === asset.assigned_to);

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteAsset(asset.id);
      if (result.error) setDeleteError(result.error);
    });
  }

  if (editing) {
    return (
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-brand-red/30 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipe Aset</label>
          <select
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
            <label className="block text-sm font-medium text-gray-700">
              {assetType === "akun_digital" ? "Nama Akun" : "Nama Aset"}
            </label>
            <input
              name="asset_name"
              defaultValue={asset.asset_name}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <input
              name="status"
              defaultValue={asset.status ?? ""}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {assetType === "barang" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kode Aset</label>
              <input
                name="asset_code"
                defaultValue={asset.asset_code ?? ""}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lokasi Kantor</label>
              <select
                name="office_location_id"
                defaultValue={asset.office_location_id ?? ""}
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
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="digital_email"
                type="email"
                defaultValue={asset.digital_email ?? ""}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">No. WhatsApp</label>
              <input
                name="digital_phone"
                defaultValue={asset.digital_phone ?? ""}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                name="digital_username"
                defaultValue={asset.digital_username ?? ""}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="digital_password"
                defaultValue={asset.digital_password ?? ""}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Ditugaskan ke</label>
          <select
            name="assigned_to"
            defaultValue={asset.assigned_to ?? ""}
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
          <label className="block text-sm font-medium text-gray-700">Catatan</label>
          <textarea
            name="notes"
            defaultValue={asset.notes ?? ""}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            Batal
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {asset.asset_type === "akun_digital" ? "Akun Digital" : "Barang"}
            </span>
            {asset.status && (
              <span className="rounded-full bg-brand-cream px-2 py-0.5 text-xs font-medium text-brand-red">
                {asset.status}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">{asset.asset_name}</p>
          {asset.asset_code && <p className="text-xs text-gray-500">Kode: {asset.asset_code}</p>}
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-brand-navy hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      </div>

      {asset.asset_type === "akun_digital" && (
        <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
          {asset.digital_email && <p>Email: {asset.digital_email}</p>}
          {asset.digital_phone && <p>No. WhatsApp: {asset.digital_phone}</p>}
          {asset.digital_username && <p>Username: {asset.digital_username}</p>}
          {asset.digital_password && (
            <p className="flex items-center gap-1.5">
              Password: {showPassword ? asset.digital_password : "••••••••"}
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
              </button>
            </p>
          )}
        </div>
      )}

      <p className="mt-2 text-sm text-gray-600">
        {assignedEmployee ? assignedEmployee.full_name : "Tidak ditugaskan"}
      </p>
      {asset.notes && <p className="mt-1 text-xs text-gray-500">{asset.notes}</p>}
      {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
    </div>
  );
}
