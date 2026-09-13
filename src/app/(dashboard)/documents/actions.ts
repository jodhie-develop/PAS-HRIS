"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface DocumentFormState {
  error: string | null;
  success: boolean;
}

export async function createDocument(
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const title = formData.get("title");
  const category = formData.get("category");
  const filePath = formData.get("file_path");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Judul wajib diisi.", success: false };
  }
  if (typeof filePath !== "string" || !filePath) {
    return { error: "File wajib diunggah.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profile?.role !== "hr_admin") {
    return { error: "Hanya HR yang bisa mengunggah dokumen.", success: false };
  }

  const { error } = await supabase.from("documents").insert({
    title: title.trim(),
    category: typeof category === "string" && category.trim() ? category.trim() : null,
    file_url: filePath,
    uploaded_by: user.id,
  });

  if (error) {
    return { error: "Gagal menyimpan dokumen. Coba lagi.", success: false };
  }

  revalidatePath("/documents");
  return { error: null, success: true };
}
