"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AssetType, CompanyAssetInsert, CompanyAssetUpdate } from "@/types/database";

export interface AssetActionState {
  error: string | null;
  success: boolean;
}

function readAssetFields(formData: FormData) {
  const asset_type = (String(formData.get("asset_type") ?? "barang") as AssetType) || "barang";
  const asset_name = String(formData.get("asset_name") ?? "").trim();
  const assigned_to = String(formData.get("assigned_to") ?? "") || null;

  if (asset_type === "akun_digital") {
    return {
      asset_type,
      asset_name,
      assigned_to,
      asset_code: null,
      office_location_id: null,
      status: String(formData.get("status") ?? "").trim() || "Aktif",
      notes: String(formData.get("notes") ?? "").trim() || null,
      digital_email: String(formData.get("digital_email") ?? "").trim() || null,
      digital_phone: String(formData.get("digital_phone") ?? "").trim() || null,
      digital_username: String(formData.get("digital_username") ?? "").trim() || null,
      digital_password: String(formData.get("digital_password") ?? "").trim() || null,
    };
  }

  return {
    asset_type,
    asset_name,
    assigned_to,
    asset_code: String(formData.get("asset_code") ?? "").trim() || null,
    office_location_id: String(formData.get("office_location_id") ?? "") || null,
    status: String(formData.get("status") ?? "").trim() || "Tersedia",
    notes: String(formData.get("notes") ?? "").trim() || null,
    digital_email: null,
    digital_phone: null,
    digital_username: null,
    digital_password: null,
  };
}

export async function createAsset(
  _prevState: AssetActionState,
  formData: FormData
): Promise<AssetActionState> {
  const fields = readAssetFields(formData);

  if (!fields.asset_name) {
    return { error: "Nama aset wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const payload: CompanyAssetInsert = fields;
  const { error } = await supabase.from("company_assets").insert(payload);

  if (error) {
    return { error: "Gagal menyimpan aset. Coba lagi.", success: false };
  }

  revalidatePath("/admin/asset");
  revalidatePath("/assets");
  return { error: null, success: true };
}

export async function updateAsset(
  id: string,
  _prevState: AssetActionState,
  formData: FormData
): Promise<AssetActionState> {
  const fields = readAssetFields(formData);

  if (!fields.asset_name) {
    return { error: "Nama aset wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const payload: CompanyAssetUpdate = fields;
  const { error } = await supabase.from("company_assets").update(payload).eq("id", id);

  if (error) {
    return { error: "Gagal memperbarui aset. Coba lagi.", success: false };
  }

  revalidatePath("/admin/asset");
  revalidatePath("/assets");
  return { error: null, success: true };
}

export async function deleteAsset(id: string): Promise<AssetActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("company_assets").delete().eq("id", id);

  if (error) {
    return { error: "Gagal menghapus aset.", success: false };
  }

  revalidatePath("/admin/asset");
  revalidatePath("/assets");
  return { error: null, success: true };
}
