"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { JobTitle, OfficeLocation, Profile, WorkShift } from "@/types/database";
import { createEmployee, type EmployeeActionState } from "./actions";
import { PhotoUploadField } from "./PhotoUploadField";

const initialState: EmployeeActionState = { error: null, success: false };

export function EmployeeCreateForm({
  jobTitles,
  supervisors,
  officeLocations,
  shifts,
}: {
  jobTitles: JobTitle[];
  supervisors: Profile[];
  officeLocations: OfficeLocation[];
  shifts: WorkShift[];
}) {
  const [state, formAction, isPending] = useActionState(createEmployee, initialState);

  if (state.success && state.temporaryPassword) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-800">Karyawan berhasil ditambahkan</h2>
        <p className="text-sm text-emerald-800">
          Catat password sementara ini sekarang — tidak akan ditampilkan lagi. Sampaikan ke karyawan
          untuk login pertama kali.
        </p>
        <div className="rounded-lg border border-emerald-300 bg-white px-4 py-3 font-mono text-lg font-semibold text-emerald-900">
          {state.temporaryPassword}
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/karyawan"
            className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white"
          >
            Kembali ke Daftar Karyawan
          </Link>
          <Link
            href="/admin/karyawan/baru"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            Tambah Karyawan Lagi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Akun Login</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Perusahaan
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="nama@prs.co.id"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Dipakai untuk login. Password sementara dibuat otomatis dan ditampilkan setelah disimpan.
            </p>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="employee"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="employee">Karyawan</option>
              <option value="supervisor">Supervisor</option>
              <option value="hr_admin">HR Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900">Data Diri</h2>
        <div className="mt-3 space-y-3">
          <PhotoUploadField />
          <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nik" className="block text-sm font-medium text-gray-700">
              NIK
            </label>
            <input
              id="nik"
              name="nik"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="personal_email" className="block text-sm font-medium text-gray-700">
              Email Pribadi
            </label>
            <input
              id="personal_email"
              name="personal_email"
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              No. Telepon
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="join_date" className="block text-sm font-medium text-gray-700">
              Tanggal Bergabung
            </label>
            <input
              id="join_date"
              name="join_date"
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ptkp_status" className="block text-sm font-medium text-gray-700">
              Status PTKP
            </label>
            <input
              id="ptkp_status"
              name="ptkp_status"
              type="text"
              placeholder="TK/0"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="npwp" className="block text-sm font-medium text-gray-700">
              NPWP
            </label>
            <input
              id="npwp"
              name="npwp"
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900">Penempatan</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="job_title_id" className="block text-sm font-medium text-gray-700">
              Jabatan
            </label>
            <select
              id="job_title_id"
              name="job_title_id"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Belum ditentukan</option>
              {jobTitles.map((jobTitle) => (
                <option key={jobTitle.id} value={jobTitle.id}>
                  {jobTitle.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="supervisor_id" className="block text-sm font-medium text-gray-700">
              Atasan / Supervisor
            </label>
            <select
              id="supervisor_id"
              name="supervisor_id"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tidak ada</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="office_location_id" className="block text-sm font-medium text-gray-700">
              Lokasi Kantor
            </label>
            <select
              id="office_location_id"
              name="office_location_id"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Belum ditentukan</option>
              {officeLocations.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="default_shift_id" className="block text-sm font-medium text-gray-700">
              Shift Default
            </label>
            <select
              id="default_shift_id"
              name="default_shift_id"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Belum ditentukan</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.shift_name} ({shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="annual_leave_quota" className="block text-sm font-medium text-gray-700">
              Kuota Cuti Tahunan
            </label>
            <input
              id="annual_leave_quota"
              name="annual_leave_quota"
              type="number"
              min={0}
              defaultValue={12}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-red px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Karyawan"}
      </button>
    </form>
  );
}
