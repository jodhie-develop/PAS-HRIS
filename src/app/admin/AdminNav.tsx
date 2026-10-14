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
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {navItems.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        if (item.href === "/admin/laporan") {
          const active = pathname.startsWith(item.href);
          return (
            <div key={item.href} className="flex shrink-0 items-center border-b-2 border-transparent">
              <span className={`px-3 py-2.5 text-sm font-medium ${active ? "text-brand-red" : "text-gray-500"}`}>
                {item.label}
              </span>
              <Link
                href="/admin/laporan/rekap-kehadiran"
                className={`mr-2 rounded-md px-2 py-1 text-xs font-medium ${
                  pathname.startsWith("/admin/laporan/rekap-kehadiran")
                    ? "bg-brand-red/10 text-brand-red"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                Rekap Kehadiran Karyawan
              </Link>
            </div>
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
