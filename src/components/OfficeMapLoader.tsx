"use client";

import dynamic from "next/dynamic";

const OfficeMap = dynamic(() => import("./OfficeMap").then((mod) => mod.OfficeMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[180px] w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
      Memuat peta...
    </div>
  ),
});

export function OfficeMapLoader(props: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  name: string;
}) {
  return <OfficeMap {...props} />;
}
