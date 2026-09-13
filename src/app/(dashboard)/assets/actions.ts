"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface AssetFormState {
  error: string | null;
  success: boolean;
}

export async function createAsset(
  _prevState: AssetFormState,
  formData: FormData
): Promise<AssetFormState> {
  const assetName = formData.get("asset_name");
  const assetCode = formData.get("asset_code");
  const assignedTo = formData.get("assigned_to");
  const status = formData.get("status");
  const notes = formData.get("notes");

  if (typeof assetName !== "string" || !assetName.trim()) {
    return { error: "Nama aset wajib diisi.", success: false };
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
    return { error: "Hanya HR yang bisa menambah aset.", success: false };
  }

  const { error } = await supabase.from("company_assets").insert({
    asset_name: assetName.trim(),
    asset_code: typeof assetCode === "string" && assetCode.trim() ? assetCode.trim() : null,
    assigned_to: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
    status: typeof status === "string" && status.trim() ? status.trim() : "Tersedia",
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });

  if (error) {
    return { error: "Gagal menyimpan aset. Coba lagi.", success: false };
  }

  revalidatePath("/assets");
  return { error: null, success: true };
}
