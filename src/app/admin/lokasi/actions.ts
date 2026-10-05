"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MIN_OFFICE_RADIUS_METERS } from "@/lib/geo";

export interface OfficeLocationActionState {
  error: string | null;
  success: boolean;
}

function parseFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || null,
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    radius_meters: Number(formData.get("radius_meters") ?? 100),
  };
}

function validate(fields: ReturnType<typeof parseFields>): string | null {
  if (!fields.name) return "Nama kantor wajib diisi.";
  if (!Number.isFinite(fields.latitude) || fields.latitude < -90 || fields.latitude > 90) {
    return "Latitude tidak valid.";
  }
  if (!Number.isFinite(fields.longitude) || fields.longitude < -180 || fields.longitude > 180) {
    return "Longitude tidak valid.";
  }
  if (!Number.isFinite(fields.radius_meters) || fields.radius_meters <= 0) {
    return "Radius tidak valid.";
  }
  if (fields.radius_meters < MIN_OFFICE_RADIUS_METERS) {
    return `Radius minimal ${MIN_OFFICE_RADIUS_METERS} m, karena akurasi GPS HP bisa meleset 10-30 m.`;
  }
  return null;
}

export async function createOfficeLocation(
  _prevState: OfficeLocationActionState,
  formData: FormData
): Promise<OfficeLocationActionState> {
  const fields = parseFields(formData);
  const validationError = validate(fields);
  if (validationError) {
    return { error: validationError, success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("office_locations").insert(fields);

  if (error) {
    return { error: "Gagal menyimpan lokasi kantor.", success: false };
  }

  revalidatePath("/admin/lokasi");
  return { error: null, success: true };
}

export async function updateOfficeLocation(
  id: string,
  _prevState: OfficeLocationActionState,
  formData: FormData
): Promise<OfficeLocationActionState> {
  const fields = parseFields(formData);
  const validationError = validate(fields);
  if (validationError) {
    return { error: validationError, success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("office_locations").update(fields).eq("id", id);

  if (error) {
    return { error: "Gagal memperbarui lokasi kantor.", success: false };
  }

  revalidatePath("/admin/lokasi");
  return { error: null, success: true };
}

export async function deleteOfficeLocation(id: string): Promise<OfficeLocationActionState> {
  const supabase = await createClient();

  const { data: assigned } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("office_location_id", id)
    .returns<{ full_name: string }[]>();
  if (assigned && assigned.length > 0) {
    return {
      error: `Masih ada ${assigned.length} karyawan di lokasi ini (${assigned.map((p) => p.full_name).join(", ")}). Pindahkan dulu di Master Karyawan.`,
      success: false,
    };
  }

  // Attendance history doesn't block this: attendances.office_location_id
  // is ON DELETE SET NULL, so the records stay with the office unlinked.
  const { error } = await supabase.from("office_locations").delete().eq("id", id);

  if (error) {
    const message =
      error.code === "23503"
        ? "Lokasi ini masih dirujuk data lain sehingga tidak bisa dihapus. Hubungi developer."
        : "Gagal menghapus lokasi kantor.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/lokasi");
  return { error: null, success: true };
}
