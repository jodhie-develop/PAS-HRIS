import type { LeaveRequest, LeaveType } from "@/types/database";

export const DEFAULT_ANNUAL_LEAVE_QUOTA = 12;

// Only annual leave draws down the quota; sakit/ijin/dinas/lainnya don't.
export const QUOTA_LEAVE_TYPE: LeaveType = "cuti";

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  cuti: "Cuti Tahunan",
  sakit: "Sakit",
  ijin: "Ijin",
  dinas_luar_kota: "Dinas Luar Kota",
  lainnya: "Lainnya",
};

// Dates are handled as UTC midnight so "YYYY-MM-DD" strings never shift a
// day because of the server's or browser's timezone.
function parseDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Working days (Mon-Fri, excluding company holidays) between start and end
// inclusive. With `year`, only days falling in that year are counted, so a
// request spanning New Year splits correctly across both quotas.
export function countLeaveDays(start: string, end: string, holidays: ReadonlySet<string>, year?: number) {
  let days = 0;
  const cursor = parseDate(start);
  const last = parseDate(end);
  while (cursor <= last) {
    const weekday = cursor.getUTCDay();
    const iso = formatDate(cursor);
    if (
      weekday !== 0 &&
      weekday !== 6 &&
      !holidays.has(iso) &&
      (year === undefined || cursor.getUTCFullYear() === year)
    ) {
      days++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export type LeaveBalance = {
  year: number;
  quota: number;
  used: number; // approved
  pending: number; // waiting for approval; reserved so it can't be double-booked
  remaining: number;
};

type QuotaRequest = Pick<LeaveRequest, "leave_type" | "status" | "start_date" | "end_date">;

export function computeLeaveBalance(
  requests: QuotaRequest[],
  quota: number | null | undefined,
  holidays: ReadonlySet<string>,
  year: number
): LeaveBalance {
  const total = quota ?? DEFAULT_ANNUAL_LEAVE_QUOTA;
  let used = 0;
  let pending = 0;
  for (const request of requests) {
    if (request.leave_type !== QUOTA_LEAVE_TYPE) continue;
    if (request.status !== "approved" && request.status !== "pending") continue;
    const days = countLeaveDays(request.start_date, request.end_date, holidays, year);
    if (request.status === "approved") used += days;
    else pending += days;
  }
  return { year, quota: total, used, pending, remaining: total - used - pending };
}

// Years touched by a date range (usually one; two across New Year).
export function yearsInRange(start: string, end: string) {
  const years: number[] = [];
  for (let y = parseDate(start).getUTCFullYear(); y <= parseDate(end).getUTCFullYear(); y++) years.push(y);
  return years;
}
