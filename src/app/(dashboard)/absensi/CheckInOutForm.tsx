"use client";

import { useState, useTransition } from "react";
import type { Attendance } from "@/types/database";
import type { DevicePosition } from "@/components/AbsensiMap";
import { getCurrentPosition } from "@/lib/geolocation";
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
}: {
  attendance: Attendance | null;
  onLocated?: (position: DevicePosition) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<AttendanceActionState>({ error: null, success: false });

  const hasCheckedIn = Boolean(attendance?.check_in);
  const hasCheckedOut = Boolean(attendance?.check_out);

  function handle(action: typeof checkIn) {
    setResult({ error: null, success: false });
    setLocating(true);

    getCurrentPosition()
      .then((position) => {
        setLocating(false);
        onLocated?.({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        const formData = new FormData();
        formData.set("latitude", String(position.coords.latitude));
        formData.set("longitude", String(position.coords.longitude));

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
            {locating ? "Mengambil lokasi..." : isPending ? "Menyimpan..." : "Check In"}
          </button>
        )}

        {hasCheckedIn && !hasCheckedOut && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handle(checkOut)}
            className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {locating ? "Mengambil lokasi..." : isPending ? "Menyimpan..." : "Check Out"}
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
