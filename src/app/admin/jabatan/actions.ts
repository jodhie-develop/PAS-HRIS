"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface JobTitleActionState {
  error: string | null;
  success: boolean;
}

export async function createJobTitle(
  _prevState: JobTitleActionState,
  formData: FormData
): Promise<JobTitleActionState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Nama jabatan wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("job_titles").insert({ name });

  if (error) {
    const message = error.code === "23505" ? "Jabatan ini sudah ada." : "Gagal menyimpan jabatan.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/jabatan");
  return { error: null, success: true };
}

export async function updateJobTitle(id: string, name: string): Promise<JobTitleActionState> {
  if (!name.trim()) {
    return { error: "Nama jabatan wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("job_titles").update({ name: name.trim() }).eq("id", id);

  if (error) {
    const message = error.code === "23505" ? "Jabatan ini sudah ada." : "Gagal memperbarui jabatan.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/jabatan");
  return { error: null, success: true };
}

export async function deleteJobTitle(id: string): Promise<JobTitleActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("job_titles").delete().eq("id", id);

  if (error) {
    const message =
      error.code === "23503"
        ? "Jabatan sedang dipakai karyawan/data gaji, tidak bisa dihapus."
        : "Gagal menghapus jabatan.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/jabatan");
  return { error: null, success: true };
}
