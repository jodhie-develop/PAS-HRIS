"use client";

import { useActionState, useState, useTransition } from "react";
import type { OfficeLocation } from "@/types/database";
import { OfficeMapLoader } from "@/components/OfficeMapLoader";
import { updateOfficeLocation, deleteOfficeLocation, type OfficeLocationActionState } from "./actions";

const initialState: OfficeLocationActionState = { error: null, success: false };

export function OfficeLocationCard({ office }: { office: OfficeLocation }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const updateWithId = updateOfficeLocation.bind(null, office.id);
  const [state, formAction, isPending] = useActionState(updateWithId, initialState);

  const [name, setName] = useState(office.name);
  const [latitude, setLatitude] = useState(String(office.latitude));
  const [longitude, setLongitude] = useState(String(office.longitude));
  const [radius, setRadius] = useState(String(office.radius_meters));

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteOfficeLocation(office.id);
      if (result.error) setDeleteError(result.error);
    });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const previewValid = Number.isFinite(lat) && Number.isFinite(lng);

  if (editing) {
    return (
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-brand-red/30 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Kantor</label>
              <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alamat</label>
              <textarea
                name="address"
                defaultValue={office.address ?? ""}
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Radius (m)</label>
                <input
                  name="radius_meters"
                  type="number"
                  min={1}
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {previewValid ? (
              <OfficeMapLoader
                latitude={lat}
                longitude={lng}
                radiusMeters={Number(radius) || 100}
                name={name}
              />
            ) : (
              <div className="flex h-[180px] w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
                Koordinat tidak valid
              </div>
            )}
          </div>
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <OfficeMapLoader
        latitude={office.latitude}
        longitude={office.longitude}
        radiusMeters={office.radius_meters}
        name={office.name}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{office.name}</p>
            <p className="mt-0.5 text-sm text-gray-500">{office.address ?? "Alamat belum diisi."}</p>
            <p className="mt-1 text-xs text-gray-400">Radius {office.radius_meters}m</p>
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
        {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
      </div>
    </div>
  );
}
