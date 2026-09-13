"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeaveType } from "@/types/database";

export interface LeaveFormState {
  error: string | null;
  success: boolean;
}

const LEAVE_TYPES: LeaveType[] = ["cuti", "sakit", "ijin", "dinas_luar_kota", "lainnya"];

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

  revalidatePath("/leave");
  return { error: null, success: true };
}
