"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SalaryActionState {
  error: string | null;
  success: boolean;
}

export async function createSalary(
  _prevState: SalaryActionState,
  formData: FormData
): Promise<SalaryActionState> {
  const job_title_id = String(formData.get("job_title_id") ?? "");
  const base_salary = Number(formData.get("base_salary") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!job_title_id) {
    return { error: "Pilih jabatan terlebih dahulu.", success: false };
  }
  if (!Number.isFinite(base_salary) || base_salary < 0) {
    return { error: "Gaji pokok tidak valid.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("salaries").insert({ job_title_id, base_salary, notes });

  if (error) {
    return { error: "Gagal menyimpan data gaji.", success: false };
  }

  revalidatePath("/admin/gaji");
  return { error: null, success: true };
}

export async function updateSalary(
  id: string,
  base_salary: number,
  notes: string
): Promise<SalaryActionState> {
  if (!Number.isFinite(base_salary) || base_salary < 0) {
    return { error: "Gaji pokok tidak valid.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("salaries")
    .update({ base_salary, notes: notes.trim() || null })
    .eq("id", id);

  if (error) {
    return { error: "Gagal memperbarui data gaji.", success: false };
  }

  revalidatePath("/admin/gaji");
  return { error: null, success: true };
}

export async function deleteSalary(id: string): Promise<SalaryActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("salaries").delete().eq("id", id);

  if (error) {
    return { error: "Gagal menghapus data gaji.", success: false };
  }

  revalidatePath("/admin/gaji");
  return { error: null, success: true };
}
