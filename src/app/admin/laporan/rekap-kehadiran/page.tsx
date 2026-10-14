import { createClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/date";
import {
  EARLY_LEAVE_GRACE_MINUTES,
  LATE_GRACE_MINUTES,
  minutesEarly,
  minutesLate,
} from "@/lib/attendance-rules";
import type { Attendance, LeaveRequest, Profile, WorkShift } from "@/types/database";

type SearchParams = Promise<{ mulai?: string; selesai?: string }>;

function isIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export default async function AttendanceReportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const today = todayInJakarta();
  const startOfMonth = `${today.slice(0, 8)}01`;
  const startDate = isIsoDate(params.mulai) ? params.mulai : startOfMonth;
  const endDate = isIsoDate(params.selesai) ? params.selesai : today;
  const validRange = startDate <= endDate;
  const supabase = await createClient();

  const [{ data: staff }, { data: shifts }, { data: attendance }, { data: leaves }] = await Promise.all([
    supabase.from("profiles").select("*").eq("is_active", true).order("full_name").returns<Profile[]>(),
    supabase.from("work_shifts").select("*").returns<WorkShift[]>(),
    validRange
      ? supabase.from("attendances").select("*").gte("date", startDate).lte("date", endDate).returns<Attendance[]>()
      : Promise.resolve({ data: [] as Attendance[] }),
    validRange
      ? supabase
          .from("leave_requests")
          .select("*")
          .eq("status", "approved")
          .lte("start_date", endDate)
          .gte("end_date", startDate)
          .returns<LeaveRequest[]>()
      : Promise.resolve({ data: [] as LeaveRequest[] }),
  ]);

  const shiftById = new Map((shifts ?? []).map((shift) => [shift.id, shift]));
  const staffById = new Map((staff ?? []).map((member) => [member.id, member]));
  const attendanceByUser = new Map<string, { total: number; normal: number; late: number; early: number }>();
  for (const record of attendance ?? []) {
    if (!record.check_in) continue;
    const counts = attendanceByUser.get(record.user_id) ?? { total: 0, normal: 0, late: 0, early: 0 };
    counts.total++;
    const profile = staffById.get(record.user_id);
    const shift = shiftById.get(record.shift_id ?? profile?.default_shift_id ?? "");
    const isLate = Boolean(shift && minutesLate(record.check_in, shift) > LATE_GRACE_MINUTES);
    if (isLate) counts.late++;
    else counts.normal++;
    if (shift && record.check_out && minutesEarly(record.check_out, shift) > EARLY_LEAVE_GRACE_MINUTES) counts.early++;
    attendanceByUser.set(record.user_id, counts);
  }

  const leaveByUser = new Map<string, { cuti: number; other: number }>();
  for (const leave of leaves ?? []) {
    if (!isIsoDate(leave.start_date) || !isIsoDate(leave.end_date)) continue;
    const first = leave.start_date > startDate ? leave.start_date : startDate;
    const last = leave.end_date < endDate ? leave.end_date : endDate;
    const days = Math.floor((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / 86400000) + 1;
    const counts = leaveByUser.get(leave.user_id) ?? { cuti: 0, other: 0 };
    if (leave.leave_type === "cuti") counts.cuti += days;
    else counts.other += days;
    leaveByUser.set(leave.user_id, counts);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Rekap Kehadiran Karyawan</h1>
        <p className="mt-1 text-sm text-gray-500">Ringkasan kehadiran dan cuti pada periode yang dipilih.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="text-sm text-gray-700">
          Tanggal mulai
          <input name="mulai" type="date" required defaultValue={startDate} className="mt-1 block rounded-md border border-gray-300 px-3 py-2" />
        </label>
        <label className="text-sm text-gray-700">
          Tanggal selesai
          <input name="selesai" type="date" required defaultValue={endDate} className="mt-1 block rounded-md border border-gray-300 px-3 py-2" />
        </label>
        <button className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white">Tampilkan</button>
      </form>

      {!validRange ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Tanggal mulai harus sebelum atau sama dengan tanggal selesai.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                {["Nama", "Jumlah Kehadiran", "Hadir Normal", "Hadir Terlambat", "Pulang Mendahului", "Cuti", "Ijin Lainnya"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(staff ?? []).map((member) => {
                const present = attendanceByUser.get(member.id) ?? { total: 0, normal: 0, late: 0, early: 0 };
                const leave = leaveByUser.get(member.id) ?? { cuti: 0, other: 0 };
                return (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{member.full_name}</td>
                    {[present.total, present.normal, present.late, present.early, leave.cuti, leave.other].map((count, index) => (
                      <td key={index} className="px-4 py-3 text-gray-700">{count}</td>
                    ))}
                  </tr>
                );
              })}
              {(staff ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Belum ada karyawan aktif.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">Cuti dan ijin dihitung dalam hari kalender dari pengajuan yang disetujui. Keterlambatan dan pulang mendahului memakai toleransi {LATE_GRACE_MINUTES} menit dari aturan shift.</p>
    </div>
  );
}
