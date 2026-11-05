"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type EmployeeRow = {
  id: string;
  full_name: string;
  nik: string;
  birth_date: string | null;
  officeLocationId: string | null;
  officeLocationName: string;
  jobTitleName: string;
  role: string;
  supervisorName: string;
  is_active: boolean;
  avatar_url: string | null;
  anywhere: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatBirthDate(date: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  employee: "Karyawan",
  supervisor: "Supervisor",
  hr_admin: "HR Admin",
};

export function EmployeeTable({ employees, branches }: { employees: EmployeeRow[]; branches: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter(
      (employee) => {
        const matchesSearch = !q || employee.full_name.toLowerCase().includes(q) || employee.nik.toLowerCase().includes(q);
        const matchesBranch = !branchFilter || (branchFilter === "__unassigned__"
          ? employee.officeLocationId === null
          : employee.officeLocationId === branchFilter);
        return matchesSearch && matchesBranch;
      }
    );
  }, [employees, query, branchFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama atau NIK..."
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          aria-label="Filter cabang"
          className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Semua Cabang</option>
          {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          <option value="__unassigned__">Belum ditempatkan</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-3">Nama</th>
              <th className="pb-2 pr-3">NIK</th>
              <th className="pb-2 pr-3">Tanggal Lahir</th>
              <th className="pb-2 pr-3">Cabang</th>
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
                <td colSpan={9} className="py-4 text-sm text-gray-500">
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
                    {employee.anywhere && (
                      <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-[10px] font-semibold text-brand-navy">
                        Anywhere
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-3 text-sm text-gray-600">{employee.nik}</td>
                <td className="py-2 pr-3 text-sm text-gray-600">{formatBirthDate(employee.birth_date)}</td>
                <td className="py-2 pr-3 text-sm text-gray-600">{employee.officeLocationName}</td>
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
