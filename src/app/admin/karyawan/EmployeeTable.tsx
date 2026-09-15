"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type EmployeeRow = {
  id: string;
  full_name: string;
  nik: string;
  jobTitleName: string;
  role: string;
  supervisorName: string;
  is_active: boolean;
  avatar_url: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const ROLE_LABELS: Record<string, string> = {
  employee: "Karyawan",
  supervisor: "Supervisor",
  hr_admin: "HR Admin",
};

export function EmployeeTable({ employees }: { employees: EmployeeRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (employee) =>
        employee.full_name.toLowerCase().includes(q) || employee.nik.toLowerCase().includes(q)
    );
  }, [employees, query]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari nama atau NIK..."
        className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-3">Nama</th>
              <th className="pb-2 pr-3">NIK</th>
              <th className="pb-2 pr-3">Jabatan</th>
              <th className="pb-2 pr-3">Role</th>
              <th className="pb-2 pr-3">Atasan</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-sm text-gray-500">
                  {employees.length === 0 ? "Belum ada karyawan." : "Tidak ditemukan."}
                </td>
              </tr>
            )}
            {filtered.map((employee) => (
              <tr key={employee.id} className="border-b border-gray-100">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    {employee.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL, not a domain we can whitelist ahead of time
                      <img
                        src={employee.avatar_url}
                        alt={employee.full_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red/10 text-xs font-semibold text-brand-red">
                        {initials(employee.full_name)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">{employee.full_name}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-sm text-gray-600">{employee.nik}</td>
                <td className="py-2 pr-3 text-sm text-gray-600">{employee.jobTitleName}</td>
                <td className="py-2 pr-3 text-sm text-gray-600">{ROLE_LABELS[employee.role] ?? employee.role}</td>
                <td className="py-2 pr-3 text-sm text-gray-600">{employee.supervisorName}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      employee.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {employee.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <Link
                    href={`/admin/karyawan/${employee.id}`}
                    className="text-xs font-medium text-brand-navy hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
