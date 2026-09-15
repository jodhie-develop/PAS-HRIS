"use client";

import { useActionState, useState } from "react";
import { OfficeMapLoader } from "@/components/OfficeMapLoader";
import { createOfficeLocation, type OfficeLocationActionState } from "./actions";

const initialState: OfficeLocationActionState = { error: null, success: false };

export function OfficeLocationForm() {
  const [state, formAction, isPending] = useActionState(createOfficeLocation, initialState);
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");

  const lat = Number(latitude);
  const lng = Number(longitude);
  const previewValid = latitude !== "" && longitude !== "" && Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Kantor Cabang</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nama Kantor
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Kantor Cabang Surabaya"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Alamat
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                Latitude
              </label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="-7.374080"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                Longitude
              </label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="112.753806"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="radius_meters" className="block text-sm font-medium text-gray-700">
                Radius (m)
              </label>
              <input
                id="radius_meters"
                name="radius_meters"
                type="number"
                min={1}
                required
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Tip: buka Google Maps, klik kanan pada lokasi kantor, lalu salin koordinat yang muncul.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          {previewValid ? (
            <OfficeMapLoader
              latitude={lat}
              longitude={lng}
              radiusMeters={Number(radius) || 100}
              name={name || "Lokasi kantor"}
            />
          ) : (
            <div className="flex h-[180px] w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
              Isi latitude &amp; longitude untuk lihat pratinjau peta
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Lokasi kantor berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Tambah Lokasi"}
      </button>
    </form>
  );
}
