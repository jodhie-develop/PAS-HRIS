"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/karyawan", label: "Karyawan" },
  { href: "/admin/jabatan", label: "Jabatan" },
  { href: "/admin/gaji", label: "Gaji" },
  { href: "/admin/shift", label: "Shift" },
  { href: "/admin/lokasi", label: "Lokasi Kantor" },
  { href: "/admin/libur", label: "Hari Libur" },
  { href: "/admin/asset", label: "Asset" },
  { href: "/admin/laporan", label: "Laporan" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-20 flex flex-wrap gap-1 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {navItems.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        if (item.href === "/admin/laporan") {
          const active = pathname.startsWith(item.href);
          return (
            <details key={item.href} className="group relative shrink-0">
              <summary
                className={`flex cursor-pointer list-none items-center gap-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
                <span aria-hidden="true" className="text-[10px]">▾</span>
              </summary>
              <div className="absolute left-0 top-full mt-1 hidden min-w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg group-open:block">
                <Link
                  href="/admin/laporan/rekap-kehadiran"
                  className={`block rounded-md px-3 py-2 text-sm ${
                    pathname.startsWith("/admin/laporan/rekap-kehadiran")
                      ? "bg-brand-red/10 font-medium text-brand-red"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Rekap Absensi
                </Link>
              </div>
            </details>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
