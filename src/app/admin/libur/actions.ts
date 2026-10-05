"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface HolidayActionState {
  error: string | null;
  success: boolean;
}

export async function createHoliday(
  _prevState: HolidayActionState,
  formData: FormData
): Promise<HolidayActionState> {
  const date = String(formData.get("date") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) {
    return { error: "Tanggal dan keterangan wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("public_holidays").insert({ date, name });

  if (error) {
    const message = error.code === "23505" ? "Tanggal ini sudah terdaftar sebagai hari libur." : "Gagal menyimpan hari libur.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/libur");
  return { error: null, success: true };
}

export async function deleteHoliday(date: string): Promise<HolidayActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("public_holidays").delete().eq("date", date);

  if (error) {
    return { error: "Gagal menghapus hari libur.", success: false };
  }

  revalidatePath("/admin/libur");
  return { error: null, success: true };
}
