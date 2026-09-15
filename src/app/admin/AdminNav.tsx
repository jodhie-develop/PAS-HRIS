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
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {navItems.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
