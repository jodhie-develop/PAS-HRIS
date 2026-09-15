"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ShiftActionState {
  error: string | null;
  success: boolean;
}

export async function createShift(
  _prevState: ShiftActionState,
  formData: FormData
): Promise<ShiftActionState> {
  const shift_name = String(formData.get("shift_name") ?? "").trim();
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");

  if (!shift_name || !start_time || !end_time) {
    return { error: "Semua field wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("work_shifts").insert({ shift_name, start_time, end_time });

  if (error) {
    return { error: "Gagal menyimpan shift.", success: false };
  }

  revalidatePath("/admin/shift");
  return { error: null, success: true };
}

export async function updateShift(
  id: string,
  shift_name: string,
  start_time: string,
  end_time: string
): Promise<ShiftActionState> {
  if (!shift_name.trim() || !start_time || !end_time) {
    return { error: "Semua field wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_shifts")
    .update({ shift_name: shift_name.trim(), start_time, end_time })
    .eq("id", id);

  if (error) {
    return { error: "Gagal memperbarui shift.", success: false };
  }

  revalidatePath("/admin/shift");
  return { error: null, success: true };
}

export async function deleteShift(id: string): Promise<ShiftActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("work_shifts").delete().eq("id", id);

  if (error) {
    const message =
      error.code === "23503"
        ? "Shift sedang dipakai karyawan/absensi, tidak bisa dihapus."
        : "Gagal menghapus shift.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/shift");
  return { error: null, success: true };
}
