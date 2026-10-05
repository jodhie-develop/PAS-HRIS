"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeaveRequest, LeaveType, Profile } from "@/types/database";
import {
  LEAVE_TYPE_LABELS,
  QUOTA_LEAVE_TYPE,
  computeLeaveBalance,
  countLeaveDays,
  yearsInRange,
} from "@/lib/leave";
import { notify, supervisorRecipients } from "@/lib/notifications";

export interface LeaveFormState {
  error: string | null;
  success: boolean;
}

const LEAVE_TYPES: LeaveType[] = ["cuti", "sakit", "ijin", "dinas_luar_kota", "lainnya"];

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function submitLeaveRequest(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const leaveType = formData.get("leave_type");
  const startDate = formData.get("start_date");
  const endDate = formData.get("end_date");
  const reason = formData.get("reason");
  const documentPath = formData.get("document_path");

  if (typeof leaveType !== "string" || !LEAVE_TYPES.includes(leaveType as LeaveType)) {
    return { error: "Jenis cuti tidak valid.", success: false };
  }
  if (typeof startDate !== "string" || typeof endDate !== "string" || !startDate || !endDate) {
    return { error: "Tanggal mulai dan selesai wajib diisi.", success: false };
  }
  if (endDate < startDate) {
    return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  // No two live (pending/approved) requests may cover the same day.
  const { data: overlapping } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .limit(1)
    .returns<LeaveRequest[]>();
  const clash = overlapping?.[0];
  if (clash) {
    return {
      error: `Tanggal bertabrakan dengan pengajuan ${LEAVE_TYPE_LABELS[clash.leave_type]} ${formatDate(clash.start_date)} - ${formatDate(clash.end_date)} (${clash.status === "approved" ? "sudah disetujui" : "menunggu persetujuan"}).`,
      success: false,
    };
  }

  if (leaveType === QUOTA_LEAVE_TYPE) {
    const years = yearsInRange(startDate, endDate);
    const yearStart = `${years[0]}-01-01`;
    const yearEnd = `${years[years.length - 1]}-12-31`;

    const [{ data: profile }, { data: holidayRows }, { data: existing }] = await Promise.all([
      supabase.from("profiles").select("annual_leave_quota").eq("id", user.id).single<Pick<Profile, "annual_leave_quota">>(),
      supabase.from("public_holidays").select("date").gte("date", yearStart).lte("date", yearEnd),
      supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("leave_type", QUOTA_LEAVE_TYPE)
        .in("status", ["pending", "approved"])
        .lte("start_date", yearEnd)
        .gte("end_date", yearStart)
        .returns<LeaveRequest[]>(),
    ]);
    const holidays = new Set((holidayRows ?? []).map((row) => row.date));

    if (countLeaveDays(startDate, endDate, holidays) === 0) {
      return {
        error: "Rentang tanggal ini hanya berisi Sabtu/Minggu atau tanggal merah, tidak perlu cuti.",
        success: false,
      };
    }

    for (const year of years) {
      const needed = countLeaveDays(startDate, endDate, holidays, year);
      const balance = computeLeaveBalance(existing ?? [], profile?.annual_leave_quota, holidays, year);
      if (needed > balance.remaining) {
        return {
          error: `Sisa cuti tahunan ${year} tinggal ${Math.max(balance.remaining, 0)} hari, pengajuan ini butuh ${needed} hari kerja.`,
          success: false,
        };
      }
    }
  }

  const { error } = await supabase.from("leave_requests").insert({
    user_id: user.id,
    leave_type: leaveType as LeaveType,
    start_date: startDate,
    end_date: endDate,
    reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    document_url: typeof documentPath === "string" && documentPath ? documentPath : null,
    status: "pending",
  });

  if (error) {
    return { error: "Gagal mengirim pengajuan. Coba lagi.", success: false };
  }

  const { data: requester } = await supabase
    .from("profiles")
    .select("id, full_name, supervisor_id")
    .eq("id", user.id)
    .single<Pick<Profile, "id" | "full_name" | "supervisor_id">>();
  if (requester) {
    const range = startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} - ${formatDate(endDate)}`;
    await notify(await supervisorRecipients(requester), {
      type: "leave_request",
      title: `${requester.full_name} mengajukan ${LEAVE_TYPE_LABELS[leaveType as LeaveType]}`,
      body: `${range}. Menunggu persetujuan Anda.`,
      link: "/approvals",
    });
  }

  revalidatePath("/leave");
  return { error: null, success: true };
}
