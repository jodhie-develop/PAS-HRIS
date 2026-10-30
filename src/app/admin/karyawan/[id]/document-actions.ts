"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function acceptEmployeeDocument(employeeId: string, documentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan masuk kembali." };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (profile?.role !== "hr_admin") return { error: "Akses hanya untuk HR Admin." };

  const { data, error } = await supabase
    .from("documents")
    .update({ status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("user_id", employeeId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Dokumen gagal diterima atau sudah diproses." };
  revalidatePath(`/admin/karyawan/${employeeId}`);
  revalidatePath("/documents");
  return { error: null };
}
