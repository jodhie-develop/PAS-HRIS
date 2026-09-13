"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ApprovalActionState {
  error: string | null;
  success: boolean;
}

export async function approveLeave(requestId: string): Promise<ApprovalActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    return { error: "Gagal menyetujui pengajuan.", success: false };
  }

  revalidatePath("/approvals");
  return { error: null, success: true };
}

export async function rejectLeave(
  requestId: string,
  rejectionReason: string
): Promise<ApprovalActionState> {
  if (!rejectionReason.trim()) {
    return { error: "Alasan penolakan wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: "rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason.trim(),
    })
    .eq("id", requestId);

  if (error) {
    return { error: "Gagal menolak pengajuan.", success: false };
  }

  revalidatePath("/approvals");
  return { error: null, success: true };
}
