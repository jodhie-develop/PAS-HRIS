"use client";

import dynamic from "next/dynamic";
import type { DevicePosition, OfficeArea } from "./AbsensiMap";

const AbsensiMap = dynamic(() => import("./AbsensiMap").then((mod) => mod.AbsensiMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
      Memuat peta...
    </div>
  ),
});

export function AbsensiMapLoader({
  devicePosition,
  office,
}: {
  devicePosition: DevicePosition;
  office: OfficeArea | null;
}) {
  return <AbsensiMap devicePosition={devicePosition} office={office} />;
}
