"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { distanceInMeters } from "@/lib/geo";
import { LOCATION_SAMPLE_COUNT } from "@/lib/geolocation";
import { todayInJakarta } from "@/lib/date";
import { ATTENDANCE_PHOTO_BUCKET } from "@/lib/attendance-photos";
import type { AttendanceLocationSample, OfficeLocation, Profile, WorkShift } from "@/types/database";
import {
  EARLY_LEAVE_GRACE_MINUTES,
  LATE_GRACE_MINUTES,
  jakartaHourMinute,
  minutesEarly,
  minutesLate,
} from "@/lib/attendance-rules";
import { notify, supervisorRecipients } from "@/lib/notifications";

export interface AttendanceActionState {
  error: string | null;
  success: boolean;
}

function parseLocationSamples(formData: FormData): AttendanceLocationSample[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("locations")));
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length !== LOCATION_SAMPLE_COUNT) return null;

  const samples: AttendanceLocationSample[] = [];
  for (const item of raw) {
    const sample = {
      lat: Number(item?.lat),
      lng: Number(item?.lng),
      accuracy: Number(item?.accuracy),
      timestamp: Number(item?.timestamp),
    };
    if (!Object.values(sample).every(Number.isFinite)) return null;
    samples.push(sample);
  }
  return samples;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function readPhoto(formData: FormData): File | null {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0 || photo.size > MAX_PHOTO_BYTES) return null;
  if (photo.type !== "image/jpeg") return null;
  return photo;
}

// Stored under the user's own folder (the bucket's RLS requires it). The
// timestamp keeps a retry after a failed save from colliding with the
// earlier upload, since the bucket doesn't allow overwrites.
async function uploadPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  kind: "checkin" | "checkout",
  photo: File
) {
  const path = `${userId}/${todayInJakarta()}/${kind}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(ATTENDANCE_PHOTO_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg", upsert: false });
  return error ? null : path;
}

// On Vercel the client IP is the first entry of x-forwarded-for; locally it
// is usually ::1 or 127.0.0.1.
async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
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

async function getShift(supabase: Awaited<ReturnType<typeof createClient>>, shiftId: string | null) {
  if (!shiftId) return null;
  const { data } = await supabase.from("work_shifts").select("*").eq("id", shiftId).maybeSingle<WorkShift>();
  return data ?? null;
}

export async function checkIn(
  _prevState: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  const locations = parseLocationSamples(formData);

  if (!locations) {
    return { error: "Lokasi tidak terdeteksi. Aktifkan GPS dan coba lagi.", success: false };
  }

  // The last reading is the most settled GPS fix, so it is the one checked
  // against the office radius and kept in the latitude/longitude columns.
  const { lat: latitude, lng: longitude } = locations[locations.length - 1];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali.", success: false };
  }

  const { profile, office } = await getProfileAndOffice(user.id, supabase);
  const anywhere = profile?.attendance_mode === "anywhere";

  let photoPath: string | null = null;

  if (anywhere) {
    const photo = readPhoto(formData);
    if (!photo) {
      return { error: "Foto selfie wajib untuk absensi Anywhere. Coba ambil foto lagi.", success: false };
    }
    photoPath = await uploadPhoto(supabase, user.id, "checkin", photo);
    if (!photoPath) {
      return { error: "Gagal mengunggah foto selfie. Coba lagi.", success: false };
    }
  } else {
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
  }

  const checkInAt = new Date().toISOString();
  const { error } = await supabase.from("attendances").insert({
    user_id: user.id,
    date: todayInJakarta(),
    check_in: checkInAt,
    check_in_latitude: latitude,
    check_in_longitude: longitude,
    check_in_locations: locations,
    check_in_ip: await getClientIp(),
    check_in_photo_url: photoPath,
    shift_id: profile?.default_shift_id ?? null,
    office_location_id: office?.id ?? null,
  });

  if (error) {
    const message = error.code === "23505"
      ? "Anda sudah check-in hari ini."
      : "Gagal menyimpan absensi. Coba lagi.";
    return { error: message, success: false };
  }

  if (profile) {
    const shift = await getShift(supabase, profile.default_shift_id);
    const late = shift ? minutesLate(checkInAt, shift) : 0;
    if (shift && late > LATE_GRACE_MINUTES) {
      await notify(await supervisorRecipients(profile), {
        type: "late",
        title: `${profile.full_name} terlambat ${late} menit`,
        body: `Check in pukul ${jakartaHourMinute(checkInAt).label} WIB, shift ${shift.shift_name} mulai ${shift.start_time.slice(0, 5)}.`,
        link: null,
      });
    }
  }

  revalidatePath("/absensi");
  return { error: null, success: true };
}

export async function checkOut(
  _prevState: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  const locations = parseLocationSamples(formData);

  if (!locations) {
    return { error: "Lokasi tidak terdeteksi. Aktifkan GPS dan coba lagi.", success: false };
  }

  // The last reading is the most settled GPS fix, so it is the one checked
  // against the office radius and kept in the latitude/longitude columns.
  const { lat: latitude, lng: longitude } = locations[locations.length - 1];

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

  let photoPath: string | null = null;

  if (profile?.attendance_mode === "anywhere") {
    const photo = readPhoto(formData);
    if (!photo) {
      return { error: "Foto selfie wajib untuk absensi Anywhere. Coba ambil foto lagi.", success: false };
    }
    photoPath = await uploadPhoto(supabase, user.id, "checkout", photo);
    if (!photoPath) {
      return { error: "Gagal mengunggah foto selfie. Coba lagi.", success: false };
    }
  }

  const checkOutAt = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("attendances")
    .update({
      check_out: checkOutAt,
      check_out_latitude: latitude,
      check_out_longitude: longitude,
      check_out_locations: locations,
      check_out_ip: await getClientIp(),
      check_out_photo_url: photoPath,
    })
    .eq("user_id", user.id)
    .eq("date", todayInJakarta())
    .is("check_out", null)
    .select("shift_id");

  if (error) {
    return { error: "Gagal menyimpan absensi. Coba lagi.", success: false };
  }

  // Only when this call actually recorded the check-out (not a repeat tap).
  if (profile && updated && updated.length > 0) {
    const shift = await getShift(supabase, updated[0].shift_id ?? profile.default_shift_id);
    const early = shift ? minutesEarly(checkOutAt, shift) : 0;
    if (shift && early > EARLY_LEAVE_GRACE_MINUTES) {
      await notify(await supervisorRecipients(profile), {
        type: "early_leave",
        title: `${profile.full_name} pulang ${early} menit lebih awal`,
        body: `Check out pukul ${jakartaHourMinute(checkOutAt).label} WIB, shift ${shift.shift_name} sampai ${shift.end_time.slice(0, 5)}.`,
        link: null,
      });
    }
  }

  revalidatePath("/absensi");
  return { error: null, success: true };
}
