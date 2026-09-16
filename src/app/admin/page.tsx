import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/date";
import type {
  Announcement,
  Attendance,
  CompanyAsset,
  LeaveRequest,
  LeaveType,
  Profile,
  WorkShift,
} from "@/types/database";
import {
  IconBriefcase,
  IconCalendarOff,
  IconClockAlert,
  IconInbox,
  IconMegaphone,
  IconUsers,
  IconUsersCheck,
} from "@/components/icons";
import { StatCard } from "./StatCard";

// How many minutes after shift start a check-in counts as "terlambat", and
// how many minutes before shift end a check-out counts as "pulang cepat".
// Not configurable yet — flagged to the user as a placeholder assumption.
const LATE_GRACE_MINUTES = 15;
const EARLY_LEAVE_GRACE_MINUTES = 15;

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  cuti: "Cuti Tahunan",
  sakit: "Sakit",
  ijin: "Ijin",
  dinas_luar_kota: "Dinas Luar Kota",
  lainnya: "Lainnya",
};

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function jakartaHourMinute(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  return { hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = todayInJakarta();

  const [
    { data: staff },
    { data: shifts },
    { data: todaysAttendance },
    { data: activeLeaves },
    { data: pendingLeaves },
    { data: announcements },
    { data: assets },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("is_active", true).returns<Profile[]>(),
    supabase.from("work_shifts").select("*").returns<WorkShift[]>(),
    supabase.from("attendances").select("*").eq("date", today).returns<Attendance[]>(),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today)
      .returns<LeaveRequest[]>(),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<LeaveRequest[]>(),
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).returns<Announcement[]>(),
    supabase.from("company_assets").select("*").returns<CompanyAsset[]>(),
  ]);

  const staffList = staff ?? [];
  const staffById = new Map(staffList.map((s) => [s.id, s]));
  const totalStaff = staffList.length;

  const shiftById = new Map((shifts ?? []).map((s) => [s.id, s]));

  const presentToday = (todaysAttendance ?? []).filter((a) => a.check_in && staffById.has(a.user_id));
  const hadirCount = presentToday.length;

  type LateEntry = { name: string; checkInLabel: string; shiftStartLabel: string; minutesLate: number };
  const lateEntries: LateEntry[] = [];
  for (const attendance of presentToday) {
    const member = staffById.get(attendance.user_id)!;
    const shiftId = attendance.shift_id ?? member.default_shift_id;
    const shift = shiftId ? shiftById.get(shiftId) : undefined;
    if (!shift || !attendance.check_in) continue;

    const { hour, minute, label: checkInLabel } = jakartaHourMinute(attendance.check_in);
    const [shiftHour, shiftMinute] = shift.start_time.split(":").map(Number);
    const minutesLate = hour * 60 + minute - (shiftHour * 60 + shiftMinute);

    if (minutesLate > LATE_GRACE_MINUTES) {
      lateEntries.push({
        name: member.full_name,
        checkInLabel,
        shiftStartLabel: shift.start_time.slice(0, 5),
        minutesLate,
      });
    }
  }
  lateEntries.sort((a, b) => b.minutesLate - a.minutesLate);
  const lateCount = lateEntries.length;

  type EarlyLeaveEntry = {
    name: string;
    checkOutLabel: string;
    shiftEndLabel: string;
    minutesEarly: number;
  };
  const earlyLeaveEntries: EarlyLeaveEntry[] = [];
  for (const attendance of presentToday) {
    if (!attendance.check_out) continue;
    const member = staffById.get(attendance.user_id)!;
    const shiftId = attendance.shift_id ?? member.default_shift_id;
    const shift = shiftId ? shiftById.get(shiftId) : undefined;
    if (!shift) continue;

    const { hour, minute, label: checkOutLabel } = jakartaHourMinute(attendance.check_out);
    const [shiftHour, shiftMinute] = shift.end_time.split(":").map(Number);
    const minutesEarly = shiftHour * 60 + shiftMinute - (hour * 60 + minute);

    if (minutesEarly > EARLY_LEAVE_GRACE_MINUTES) {
      earlyLeaveEntries.push({
        name: member.full_name,
        checkOutLabel,
        shiftEndLabel: shift.end_time.slice(0, 5),
        minutesEarly,
      });
    }
  }
  earlyLeaveEntries.sort((a, b) => b.minutesEarly - a.minutesEarly);
  const earlyLeaveCount = earlyLeaveEntries.length;

  const leavesToday = (activeLeaves ?? []).filter((l) => staffById.has(l.user_id));
  const offCount = leavesToday.length;
  const leaveByType = leavesToday.reduce<Partial<Record<LeaveType, number>>>((acc, l) => {
    acc[l.leave_type] = (acc[l.leave_type] ?? 0) + 1;
    return acc;
  }, {});

  const pendingCount = (pendingLeaves ?? []).length;
  const recentPending = (pendingLeaves ?? []).slice(0, 5);

  const announcementCount = (announcements ?? []).length;
  const recentAnnouncements = (announcements ?? []).slice(0, 4);

  const assetList = assets ?? [];
  const assetCount = assetList.length;
  const assetByStatus = assetList.reduce<Record<string, number>>((acc, a) => {
    const key = a.status ?? "Tanpa status";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const maxAssetStatusCount = Math.max(1, ...Object.values(assetByStatus));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-brand-red to-brand-red-dark p-6 text-white shadow-sm">
        <p className="text-sm text-white/80">
          {new Date().toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Ringkasan Hari Ini</h1>
        <p className="mt-1 text-sm text-white/80">
          {hadirCount} dari {totalStaff} staff sudah hadir
          {lateCount > 0 && `, ${lateCount} terlambat`}
          {earlyLeaveCount > 0 && `, ${earlyLeaveCount} pulang cepat`}
          {offCount > 0 && `, ${offCount} sedang off/cuti/sakit`}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Staff" value={totalStaff} icon={IconUsers} accent="navy" />
        <StatCard label="Hadir Hari Ini" value={hadirCount} icon={IconUsersCheck} accent="green" />
        <StatCard label="Terlambat" value={lateCount} icon={IconClockAlert} accent="amber" />
        <StatCard label="Pulang Cepat" value={earlyLeaveCount} icon={IconClockAlert} accent="amber" />
        <StatCard label="Off / Cuti / Sakit" value={offCount} icon={IconCalendarOff} accent="red" />
        <StatCard label="Pengajuan Cuti Pending" value={pendingCount} icon={IconInbox} accent="amber" />
        <StatCard label="Total Aset" value={assetCount} icon={IconBriefcase} accent="navy" />
        <StatCard label="Pengumuman" value={announcementCount} icon={IconMegaphone} accent="green" />
      </div>

      {Object.keys(leaveByType).length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Rincian Off Hari Ini</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(leaveByType).map(([type, count]) => (
              <span
                key={type}
                className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-medium text-brand-red"
              >
                {LEAVE_TYPE_LABELS[type as LeaveType]}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Pengajuan Cuti Menunggu</h2>
            <Link href="/approvals" className="text-xs font-medium text-brand-navy hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentPending.length === 0 && (
              <p className="text-sm text-gray-500">Tidak ada pengajuan yang menunggu.</p>
            )}
            {recentPending.map((request) => (
              <div key={request.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">
                  {staffById.get(request.user_id)?.full_name ?? "-"}
                </p>
                <p className="text-xs text-gray-500">
                  {LEAVE_TYPE_LABELS[request.leave_type]} · {formatDateShort(request.start_date)} -{" "}
                  {formatDateShort(request.end_date)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Pengumuman Terbaru</h2>
            <Link href="/announcements" className="text-xs font-medium text-brand-navy hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentAnnouncements.length === 0 && (
              <p className="text-sm text-gray-500">Belum ada pengumuman.</p>
            )}
            {recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                <p className="text-xs text-gray-500">{formatDateShort(announcement.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Karyawan Terlambat Hari Ini</h2>
          <div className="mt-3 space-y-2">
            {lateEntries.length === 0 && (
              <p className="text-sm text-gray-500">Tidak ada keterlambatan hari ini.</p>
            )}
            {lateEntries.slice(0, 6).map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                  <p className="text-xs text-gray-500">
                    Masuk {entry.checkInLabel} · shift {entry.shiftStartLabel}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  +{entry.minutesLate} mnt
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Karyawan Pulang Cepat Hari Ini</h2>
          <div className="mt-3 space-y-2">
            {earlyLeaveEntries.length === 0 && (
              <p className="text-sm text-gray-500">Tidak ada yang pulang cepat hari ini.</p>
            )}
            {earlyLeaveEntries.slice(0, 6).map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                  <p className="text-xs text-gray-500">
                    Pulang {entry.checkOutLabel} · shift sampai {entry.shiftEndLabel}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  -{entry.minutesEarly} mnt
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Aset Perusahaan</h2>
          <Link href="/admin/asset" className="text-xs font-medium text-brand-navy hover:underline">
            Kelola
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {Object.keys(assetByStatus).length === 0 && (
            <p className="text-sm text-gray-500">Belum ada aset terdaftar.</p>
          )}
          {Object.entries(assetByStatus).map(([status, count]) => (
            <div key={status}>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{status}</span>
                <span>{count}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-navy"
                  style={{ width: `${(count / maxAssetStatusCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
