"use client";

import { useState, useTransition, type RefObject } from "react";
import type { Attendance } from "@/types/database";
import type { DevicePosition } from "@/components/AbsensiMap";
import type { CaptureSelfie } from "@/components/SelfieCamera";
import {
  getPositionSamples,
  LOCATION_SAMPLE_COUNT,
  LOCATION_SAMPLE_INTERVAL_MS,
} from "@/lib/geolocation";
import { checkIn, checkOut, type AttendanceActionState } from "./actions";

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CheckInOutForm({
  attendance,
  onLocated,
  selfieRef,
}: {
  attendance: Attendance | null;
  onLocated?: (position: DevicePosition) => void;
  // Set for "anywhere" employees: a selfie is taken before each check-in/out.
  selfieRef?: RefObject<CaptureSelfie | null>;
}) {
  const [isPending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [samplesTaken, setSamplesTaken] = useState(0);
  const [result, setResult] = useState<AttendanceActionState>({ error: null, success: false });

  const hasCheckedIn = Boolean(attendance?.check_in);
  const hasCheckedOut = Boolean(attendance?.check_out);

  async function handle(action: typeof checkIn) {
    setResult({ error: null, success: false });

    // Take the selfie first, at the moment of the tap, not after GPS settles.
    let photo: Blob | null = null;
    if (selfieRef) {
      const capture = selfieRef.current;
      if (!capture) {
        setResult({ error: "Kamera belum siap. Izinkan akses kamera lalu coba lagi.", success: false });
        return;
      }
      try {
        photo = await capture();
      } catch {
        setResult({ error: "Gagal mengambil foto. Coba lagi.", success: false });
        return;
      }
    }

    setLocating(true);
    setSamplesTaken(0);

    getPositionSamples(LOCATION_SAMPLE_COUNT, LOCATION_SAMPLE_INTERVAL_MS, setSamplesTaken)
      .then((samples) => {
        setLocating(false);
        const last = samples[samples.length - 1];
        onLocated?.({ lat: last.lat, lng: last.lng, accuracy: last.accuracy });
        const formData = new FormData();
        formData.set("locations", JSON.stringify(samples));
        if (photo) formData.set("photo", photo, "selfie.jpg");

        startTransition(async () => {
          const outcome = await action({ error: null, success: false }, formData);
          setResult(outcome);
        });
      })
      .catch(() => {
        setLocating(false);
        setResult({
          error: "Tidak bisa mengambil lokasi. Pastikan izin GPS diaktifkan.",
          success: false,
        });
      });
  }

  const busy = locating || isPending;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-gray-500">Check In</p>
          <p className="text-lg font-semibold text-gray-900">{formatTime(attendance?.check_in ?? null)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Check Out</p>
          <p className="text-lg font-semibold text-gray-900">{formatTime(attendance?.check_out ?? null)}</p>
        </div>
      </div>

      <div className="mt-4">
        {!hasCheckedIn && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handle(checkIn)}
            className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {locating ? `Mengambil lokasi (${samplesTaken}/${LOCATION_SAMPLE_COUNT})...` : isPending ? "Menyimpan..." : selfieRef ? "Ambil Selfie & Check In" : "Check In"}
          </button>
        )}

        {hasCheckedIn && !hasCheckedOut && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handle(checkOut)}
            className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {locating ? `Mengambil lokasi (${samplesTaken}/${LOCATION_SAMPLE_COUNT})...` : isPending ? "Menyimpan..." : selfieRef ? "Ambil Selfie & Check Out" : "Check Out"}
          </button>
        )}

        {hasCheckedIn && hasCheckedOut && (
          <p className="text-center text-sm text-gray-500">Absensi hari ini selesai.</p>
        )}
      </div>

      {result.error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {result.error}
        </p>
      )}
    </div>
  );
}
