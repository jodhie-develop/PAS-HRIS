"use client";

import { useEffect, useRef, useState } from "react";
import type { Attendance, AttendanceMode, OfficeLocation } from "@/types/database";
import type { DevicePosition } from "@/components/AbsensiMap";
import { AbsensiMapLoader } from "@/components/AbsensiMapLoader";
import { SelfieCamera, type CaptureSelfie } from "@/components/SelfieCamera";
import { getCurrentPosition } from "@/lib/geolocation";
import { distanceInMeters } from "@/lib/geo";
import { CheckInOutForm } from "./CheckInOutForm";

export type TodayPhotos = { checkIn: string | null; checkOut: string | null };

export function AbsensiClient({
  office,
  attendance,
  mode,
  employeeName,
  photos,
}: {
  office: OfficeLocation | null;
  attendance: Attendance | null;
  mode: AttendanceMode;
  employeeName: string;
  // Signed URLs of today's selfies (anywhere mode only).
  photos: TodayPhotos;
}) {
  const selfieRef = useRef<CaptureSelfie | null>(null);
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

  const officeArea = office
    ? { lat: office.latitude, lng: office.longitude, radius: office.radius_meters, name: office.name }
    : null;
  const distance =
    devicePosition && office
      ? Math.round(distanceInMeters(devicePosition.lat, devicePosition.lng, office.latitude, office.longitude))
      : null;
  const insideRadius = distance !== null && office !== null && distance <= office.radius_meters;

  if (mode === "anywhere") {
    const finished = Boolean(attendance?.check_out);

    return (
      <>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {!finished && <SelfieCamera captureRef={selfieRef} stampName={employeeName} />}
          <div className="p-3">
            <p className="text-sm font-semibold text-gray-900">Mode Absensi Anywhere</p>
            <p className="text-sm text-gray-500">
              Anda bisa absen dari mana saja. Setiap Check In / Check Out wajib foto selfie dari kamera.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-navy" />
              {devicePosition
                ? `Lokasi GPS tetap dicatat (akurasi ±${Math.round(devicePosition.accuracy)} m)`
                : (locationError ?? "Mengambil lokasi GPS...")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <CheckInOutForm attendance={attendance} onLocated={setDevicePosition} selfieRef={selfieRef} />
        </div>

        {(photos.checkIn || photos.checkOut) && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-900">Foto Absensi Hari Ini</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { label: "Check In", url: photos.checkIn },
                { label: "Check Out", url: photos.checkOut },
              ].map(({ label, url }) => (
                <div key={label}>
                  <p className="mb-1 text-xs text-gray-500">{label}</p>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
                    <img src={url} alt={`Selfie ${label}`} className="aspect-square w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
                      Belum ada
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {devicePosition ? (
          <AbsensiMapLoader devicePosition={devicePosition} office={officeArea} />
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
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-red bg-brand-red/20" /> Area absen
                kantor (radius {office.radius_meters} m)
              </p>
              {distance !== null && (
                <p
                  className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    insideRadius ? "bg-green-50 text-green-700" : "bg-red-50 text-brand-red"
                  }`}
                >
                  {insideRadius
                    ? `Anda berada di dalam area kantor (${distance} m dari titik kantor).`
                    : `Anda berada ${distance} m dari titik kantor, di luar radius ${office.radius_meters} m.`}
                </p>
              )}
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
