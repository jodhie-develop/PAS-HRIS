"use client";

import { useEffect, useState } from "react";
import type { Attendance, OfficeLocation } from "@/types/database";
import type { DevicePosition } from "@/components/AbsensiMap";
import { AbsensiMapLoader } from "@/components/AbsensiMapLoader";
import { getCurrentPosition } from "@/lib/geolocation";
import { CheckInOutForm } from "./CheckInOutForm";

export function AbsensiClient({
  office,
  attendance,
}: {
  office: OfficeLocation | null;
  attendance: Attendance | null;
}) {
  const [devicePosition, setDevicePosition] = useState<DevicePosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPosition()
      .then((position) => {
        setLocationError(null);
        setDevicePosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      })
      .catch(() => {
        setLocationError("Tidak bisa mengambil lokasi GPS. Pastikan izin lokasi diaktifkan.");
      });
  }, []);

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {devicePosition ? (
          <AbsensiMapLoader devicePosition={devicePosition} />
        ) : (
          <div className="flex h-[220px] w-full items-center justify-center bg-gray-50 p-4 text-center text-sm text-gray-400">
            {locationError ?? "Mengambil lokasi GPS..."}
          </div>
        )}

        <div className="p-3">
          {devicePosition && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-navy" /> Lokasi Anda saat ini (akurasi
              ±{Math.round(devicePosition.accuracy)} m)
            </p>
          )}
          {office ? (
            <>
              <p className="mt-1 text-xs font-medium text-gray-500">Anda tercatat harus absen di :</p>
              <p className="text-sm font-semibold text-gray-900">{office.name}</p>
              <p className="text-sm text-gray-500">{office.address ?? "Alamat belum diisi."}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Lokasi kantor belum diatur untuk akun Anda. Hubungi HR.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <CheckInOutForm attendance={attendance} onLocated={setDevicePosition} />
      </div>
    </>
  );
}
