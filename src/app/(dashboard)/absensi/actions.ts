"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { distanceInMeters } from "@/lib/geo";
import { todayInJakarta } from "@/lib/date";
import type { OfficeLocation, Profile } from "@/types/database";

export interface AttendanceActionState {
  error: string | null;
  success: boolean;
}

async function getProfileAndOffice(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (!profile?.office_location_id) {
    return { profile, office: null };
  }

  const { data: office } = await supabase
    .from("office_locations")
    .select("*")
    .eq("id", profile.office_location_id)
    .single<OfficeLocation>();

  return { profile, office };
}

export async function checkIn(
  _prevState: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Lokasi tidak terdeteksi. Aktifkan GPS dan coba lagi.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  const { profile, office } = await getProfileAndOffice(user.id, supabase);

  if (!office) {
    return { error: "Lokasi kantor belum diatur untuk akun Anda. Hubungi HR.", success: false };
  }

  const distance = distanceInMeters(latitude, longitude, office.latitude, office.longitude);
  if (distance > office.radius_meters) {
    return {
      error: `Anda berada ${Math.round(distance)}m dari ${office.name}, di luar radius ${office.radius_meters}m yang diizinkan.`,
      success: false,
    };
  }

  const { error } = await supabase.from("attendances").insert({
    user_id: user.id,
    date: todayInJakarta(),
    check_in: new Date().toISOString(),
    check_in_latitude: latitude,
    check_in_longitude: longitude,
    shift_id: profile?.default_shift_id ?? null,
    office_location_id: office.id,
  });

  if (error) {
    const message = error.code === "23505"
      ? "Anda sudah check-in hari ini."
      : "Gagal menyimpan absensi. Coba lagi.";
    return { error: message, success: false };
  }

  revalidatePath("/absensi");
  return { error: null, success: true };
}

export async function checkOut(
  _prevState: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Lokasi tidak terdeteksi. Aktifkan GPS dan coba lagi.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  const { error } = await supabase
    .from("attendances")
    .update({
      check_out: new Date().toISOString(),
      check_out_latitude: latitude,
      check_out_longitude: longitude,
    })
    .eq("user_id", user.id)
    .eq("date", todayInJakarta())
    .is("check_out", null);

  if (error) {
    return { error: "Gagal menyimpan absensi. Coba lagi.", success: false };
  }

  revalidatePath("/absensi");
  return { error: null, success: true };
}
