"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobTitle, UserRole } from "@/types/database";

export interface EmployeeActionState {
  error: string | null;
  success: boolean;
  temporaryPassword?: string;
}

function generateTemporaryPassword() {
  return randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
}

function readProfileFields(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    nik: String(formData.get("nik") ?? "").trim(),
    role: String(formData.get("role") ?? "employee") as UserRole,
    job_title_id: String(formData.get("job_title_id") ?? "") || null,
    supervisor_id: String(formData.get("supervisor_id") ?? "") || null,
    office_location_id: String(formData.get("office_location_id") ?? "") || null,
    default_shift_id: String(formData.get("default_shift_id") ?? "") || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    personal_email: String(formData.get("personal_email") ?? "").trim() || null,
    avatar_url: String(formData.get("avatar_url") ?? "").trim() || null,
    join_date: String(formData.get("join_date") ?? "") || null,
    ptkp_status: String(formData.get("ptkp_status") ?? "").trim() || null,
    npwp: String(formData.get("npwp") ?? "").trim() || null,
    annual_leave_quota: formData.get("annual_leave_quota")
      ? Number(formData.get("annual_leave_quota"))
      : 12,
  };
}

export async function createEmployee(
  _prevState: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const fields = readProfileFields(formData);

  if (!email || !fields.full_name || !fields.nik) {
    return { error: "Email, nama lengkap, dan NIK wajib diisi.", success: false };
  }

  const supabase = await createClient();

  let job_title_name: string | null = null;
  if (fields.job_title_id) {
    const { data: jobTitle } = await supabase
      .from("job_titles")
      .select("*")
      .eq("id", fields.job_title_id)
      .maybeSingle<JobTitle>();
    job_title_name = jobTitle?.name ?? null;
  }

  let supabaseAdmin: ReturnType<typeof createAdminClient>;
  try {
    supabaseAdmin = createAdminClient();
  } catch {
    return {
      error: "Konfigurasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY belum di-set). Hubungi developer.",
      success: false,
    };
  }
  const temporaryPassword = generateTemporaryPassword();

  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });

  if (authError || !created.user) {
    const message = authError?.message.includes("already been registered")
      ? "Email sudah terdaftar."
      : "Gagal membuat akun login.";
    return { error: message, success: false };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    nik: fields.nik,
    full_name: fields.full_name,
    job_title: job_title_name,
    job_title_id: fields.job_title_id,
    role: fields.role,
    supervisor_id: fields.supervisor_id,
    office_location_id: fields.office_location_id,
    default_shift_id: fields.default_shift_id,
    ptkp_status: fields.ptkp_status,
    npwp: fields.npwp,
    phone: fields.phone,
    personal_email: fields.personal_email,
    avatar_url: fields.avatar_url,
    join_date: fields.join_date,
    annual_leave_quota: fields.annual_leave_quota,
  });

  if (profileError) {
    // Roll back the orphaned auth user so a failed save doesn't leave a
    // login-only account with no profile behind.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    const message = profileError.code === "23505" ? "NIK sudah terdaftar." : "Gagal menyimpan data karyawan.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/karyawan");
  return { error: null, success: true, temporaryPassword };
}

export async function resetEmployeePassword(id: string): Promise<EmployeeActionState> {
  let supabaseAdmin: ReturnType<typeof createAdminClient>;
  try {
    supabaseAdmin = createAdminClient();
  } catch {
    return {
      error: "Konfigurasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY belum di-set). Hubungi developer.",
      success: false,
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password: temporaryPassword,
    user_metadata: { must_change_password: true },
  });

  if (error) {
    return { error: "Gagal mereset password.", success: false };
  }

  return { error: null, success: true, temporaryPassword };
}

export async function updateEmployee(
  id: string,
  _prevState: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  const fields = readProfileFields(formData);
  const is_active = formData.get("is_active") === "on";
  const companyEmail = String(formData.get("company_email") ?? "").trim();

  if (!fields.full_name || !fields.nik) {
    return { error: "Nama lengkap dan NIK wajib diisi.", success: false };
  }

  const supabase = await createClient();

  let job_title_name: string | null = null;
  if (fields.job_title_id) {
    const { data: jobTitle } = await supabase
      .from("job_titles")
      .select("*")
      .eq("id", fields.job_title_id)
      .maybeSingle<JobTitle>();
    job_title_name = jobTitle?.name ?? null;
  }

  if (companyEmail) {
    let supabaseAdmin: ReturnType<typeof createAdminClient>;
    try {
      supabaseAdmin = createAdminClient();
    } catch {
      return {
        error: "Konfigurasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY belum di-set). Hubungi developer.",
        success: false,
      };
    }
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(id);
    if (currentUser.user && currentUser.user.email !== companyEmail) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email: companyEmail,
        email_confirm: true,
      });
      if (emailError) {
        const message = emailError.message.includes("already been registered")
          ? "Email perusahaan sudah dipakai akun lain."
          : "Gagal memperbarui email perusahaan.";
        return { error: message, success: false };
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nik: fields.nik,
      full_name: fields.full_name,
      job_title: job_title_name,
      job_title_id: fields.job_title_id,
      role: fields.role,
      supervisor_id: fields.supervisor_id,
      office_location_id: fields.office_location_id,
      default_shift_id: fields.default_shift_id,
      ptkp_status: fields.ptkp_status,
      npwp: fields.npwp,
      phone: fields.phone,
      personal_email: fields.personal_email,
      avatar_url: fields.avatar_url,
      join_date: fields.join_date,
      annual_leave_quota: fields.annual_leave_quota,
      is_active,
    })
    .eq("id", id);

  if (error) {
    const message = error.code === "23505" ? "NIK sudah dipakai karyawan lain." : "Gagal memperbarui data karyawan.";
    return { error: message, success: false };
  }

  revalidatePath("/admin/karyawan");
  revalidatePath(`/admin/karyawan/${id}`);
  return { error: null, success: true };
}
