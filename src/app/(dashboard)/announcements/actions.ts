"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface AnnouncementFormState {
  error: string | null;
  success: boolean;
}

export async function createAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const title = formData.get("title");
  const content = formData.get("content");
  const filePath = formData.get("file_path");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Judul wajib diisi.", success: false };
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
    return { error: "Hanya HR yang bisa membuat pengumuman.", success: false };
  }

  const { error } = await supabase.from("announcements").insert({
    title: title.trim(),
    content: typeof content === "string" && content.trim() ? content.trim() : null,
    file_url: typeof filePath === "string" && filePath ? filePath : null,
    created_by: user.id,
  });

  if (error) {
    return { error: "Gagal membuat pengumuman. Coba lagi.", success: false };
  }

  revalidatePath("/announcements");
  return { error: null, success: true };
}
