import type { WorkShift } from "@/types/database";

// How many minutes after shift start a check-in counts as "terlambat", and
// how many minutes before shift end a check-out counts as "pulang cepat".
// Not configurable yet — flagged to the user as a placeholder assumption.
export const LATE_GRACE_MINUTES = 15;
export const EARLY_LEAVE_GRACE_MINUTES = 15;

export function jakartaHourMinute(iso: string) {
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

function minutesOfDay(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

// Minutes after shift start (negative = early). Late when > LATE_GRACE_MINUTES.
export function minutesLate(checkInIso: string, shift: Pick<WorkShift, "start_time">) {
  const { hour, minute } = jakartaHourMinute(checkInIso);
  return hour * 60 + minute - minutesOfDay(shift.start_time);
}

// Minutes before shift end (negative = stayed late). Early when > EARLY_LEAVE_GRACE_MINUTES.
export function minutesEarly(checkOutIso: string, shift: Pick<WorkShift, "end_time">) {
  const { hour, minute } = jakartaHourMinute(checkOutIso);
  return minutesOfDay(shift.end_time) - (hour * 60 + minute);
}
