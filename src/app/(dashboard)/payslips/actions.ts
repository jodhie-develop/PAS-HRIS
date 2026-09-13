"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface PayslipFormState {
  error: string | null;
  success: boolean;
}

async function requireHrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Sesi berakhir, silakan masuk kembali." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profile?.role !== "hr_admin") {
    return { supabase, user: null, error: "Hanya HR yang bisa mengelola slip gaji." };
  }

  return { supabase, user, error: null };
}

export async function createPayslip(
  _prevState: PayslipFormState,
  formData: FormData
): Promise<PayslipFormState> {
  const { supabase, user, error: authError } = await requireHrAdmin();
  if (!user) {
    return { error: authError, success: false };
  }

  const targetUserId = formData.get("user_id");
  const periodMonth = Number(formData.get("period_month"));
  const periodYear = Number(formData.get("period_year"));
  const payslipType = formData.get("payslip_type");
  const grossIncome = Number(formData.get("gross_income"));
  const totalDeductions = Number(formData.get("total_deductions"));
  const filePath = formData.get("file_path");
  const isDraft = formData.get("is_draft") === "on";

  if (typeof targetUserId !== "string" || !targetUserId) {
    return { error: "Pilih karyawan.", success: false };
  }
  if (typeof payslipType !== "string" || !payslipType.trim()) {
    return { error: "Jenis slip wajib diisi.", success: false };
  }
  if (!periodMonth || periodMonth < 1 || periodMonth > 12) {
    return { error: "Bulan tidak valid.", success: false };
  }
  if (!periodYear || periodYear < 2000) {
    return { error: "Tahun tidak valid.", success: false };
  }
  if (Number.isNaN(grossIncome) || Number.isNaN(totalDeductions)) {
    return { error: "Nominal gaji tidak valid.", success: false };
  }

  const { error } = await supabase.from("payslips").insert({
    user_id: targetUserId,
    period_month: periodMonth,
    period_year: periodYear,
    payslip_type: payslipType.trim(),
    gross_income: grossIncome,
    total_deductions: totalDeductions,
    take_home_pay: grossIncome - totalDeductions,
    pdf_url: typeof filePath === "string" && filePath ? filePath : null,
    is_draft: isDraft,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "Slip gaji untuk karyawan, jenis, dan periode ini sudah ada."
        : "Gagal menyimpan slip gaji. Coba lagi.";
    return { error: message, success: false };
  }

  revalidatePath("/payslips");
  return { error: null, success: true };
}

export async function publishPayslip(payslipId: string): Promise<PayslipFormState> {
  const { supabase, user, error: authError } = await requireHrAdmin();
  if (!user) {
    return { error: authError, success: false };
  }

  const { error } = await supabase
    .from("payslips")
    .update({ is_draft: false })
    .eq("id", payslipId);

  if (error) {
    return { error: "Gagal mempublikasikan slip gaji.", success: false };
  }

  revalidatePath("/payslips");
  return { error: null, success: true };
}
