"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type DocumentTypeActionState = { error: string | null; success: boolean };

async function requireHr() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return profile?.role === "hr_admin" ? supabase : null;
}

export async function createDocumentType(_prev: DocumentTypeActionState, formData: FormData): Promise<DocumentTypeActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama jenis dokumen wajib diisi.", success: false };
  const supabase = await requireHr();
  if (!supabase) return { error: "Akses hanya untuk HR Admin.", success: false };
  const { error } = await supabase.from("document_types").insert({ name });
  if (error) return { error: error.code === "23505" ? "Jenis dokumen sudah ada." : "Gagal menyimpan jenis dokumen.", success: false };
  revalidatePath("/admin/dokumen");
  revalidatePath("/documents");
  return { error: null, success: true };
}

export async function deleteDocumentType(id: string): Promise<DocumentTypeActionState> {
  const supabase = await requireHr();
  if (!supabase) return { error: "Akses hanya untuk HR Admin.", success: false };
  const { error } = await supabase.from("document_types").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus jenis dokumen.", success: false };
  revalidatePath("/admin/dokumen");
  revalidatePath("/documents");
  return { error: null, success: true };
}
