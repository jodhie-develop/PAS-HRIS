"use client";

import { useState } from "react";
import { getPositionSamples, LOCATION_SAMPLE_COUNT, LOCATION_SAMPLE_INTERVAL_MS } from "@/lib/geolocation";

// Above this, the reading is probably from wifi/cell towers rather than GPS
// and shouldn't be trusted as an office pin without a retry.
const LOW_ACCURACY_METERS = 30;

type Status =
  | { kind: "idle" }
  | { kind: "loading"; taken: number }
  | { kind: "done"; accuracy: number }
  | { kind: "error"; message: string };

function errorMessage(error: unknown) {
  if (error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.";
    }
    if (error.code === error.TIMEOUT) {
      return "GPS terlalu lama merespons. Coba di area terbuka atau dekat jendela, lalu ulangi.";
    }
    return "Lokasi tidak tersedia. Pastikan GPS/Lokasi di HP aktif.";
  }
  return error instanceof Error ? error.message : "Gagal mengambil lokasi GPS.";
}

export function UseMyLocationButton({
  onLocated,
}: {
  onLocated: (latitude: number, longitude: number) => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleClick() {
    setStatus({ kind: "loading", taken: 0 });
    try {
      const samples = await getPositionSamples(LOCATION_SAMPLE_COUNT, LOCATION_SAMPLE_INTERVAL_MS, (taken) =>
        setStatus({ kind: "loading", taken })
      );
      const best = samples.reduce((a, b) => (b.accuracy < a.accuracy ? b : a));
      onLocated(best.lat, best.lng);
      setStatus({ kind: "done", accuracy: Math.round(best.accuracy) });
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  const loading = status.kind === "loading";

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-brand-navy px-3 py-2 text-sm font-semibold text-brand-navy transition-colors duration-150 hover:bg-brand-navy/5 active:bg-brand-navy/10 disabled:opacity-60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`}
        >
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
        </svg>
        {loading
          ? `Mengambil lokasi GPS... (${status.taken}/${LOCATION_SAMPLE_COUNT})`
          : "Gunakan Lokasi GPS Saya Saat Ini"}
      </button>

      {status.kind === "done" && (
        <p
          className={`mt-1.5 text-xs ${
            status.accuracy > LOW_ACCURACY_METERS ? "font-medium text-amber-700" : "text-green-700"
          }`}
        >
          {status.accuracy > LOW_ACCURACY_METERS
            ? `Lokasi terisi, tapi akurasi rendah (±${status.accuracy} m). Sebaiknya ulangi di area terbuka / dekat jendela.`
            : `Lokasi terisi (akurasi ±${status.accuracy} m). Cek pin di peta, lalu simpan.`}
        </p>
      )}
      {status.kind === "error" && <p className="mt-1.5 text-xs font-medium text-brand-red">{status.message}</p>}
      {status.kind === "idle" && (
        <p className="mt-1.5 text-xs text-gray-500">
          Lakukan dari dalam kantor yang bersangkutan, sebaiknya pakai HP.
        </p>
      )}
    </div>
  );
}
