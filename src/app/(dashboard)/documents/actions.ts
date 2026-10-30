"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const categoryName = typeof category === "string" ? category.trim() : "";
  const extractedNik = String(formData.get("extracted_nik") ?? "").trim();
  const extractedName = String(formData.get("extracted_name") ?? "").trim();
  const extractedAddress = String(formData.get("extracted_address") ?? "").trim();

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
  if (!filePath.startsWith(`${user.id}/`)) {
    return { error: "Lokasi file tidak valid.", success: false };
  }

  if (!categoryName) return { error: "Pilih jenis dokumen.", success: false };
  if (categoryName.toUpperCase() === "KTP" && (!/^\d{16}$/.test(extractedNik) || !extractedName || !extractedAddress)) {
    return { error: "Data KTP wajib berisi NIK 16 digit, nama, dan alamat.", success: false };
  }
  const { data: documentType } = await supabase
    .from("document_types")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();
  if (!documentType) return { error: "Jenis dokumen tidak valid.", success: false };

  const { error } = await supabase.from("documents").insert({
    title: title.trim(),
    category: categoryName,
    file_url: filePath,
    uploaded_by: user.id,
    user_id: user.id,
    extracted_nik: categoryName.toUpperCase() === "KTP" ? extractedNik : null,
    extracted_name: categoryName.toUpperCase() === "KTP" ? extractedName : null,
    extracted_address: categoryName.toUpperCase() === "KTP" ? extractedAddress : null,
  });

  if (error) {
    return { error: "Gagal menyimpan dokumen. Coba lagi.", success: false };
  }

  revalidatePath("/documents");
  return { error: null, success: true };
}
