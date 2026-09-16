import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Payslip, Profile } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { PayslipForm } from "./PayslipForm";
import { PublishButton } from "./PublishButton";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatIDR(value: number) {
  return value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

function periodLabel(month: number, year: number) {
  return `${MONTHS[month - 1] ?? month} ${year}`;
}

export default async function PayslipsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  // Payslips are the most sensitive data in this app: employees see only
  // their own, hr_admin sees everyone's, and supervisors get none at all
  // (unlike attendances/leave_requests, they have no subordinate access here).
  if (profile?.role === "supervisor") {
    redirect("/absensi");
  }

  if (profile?.role === "hr_admin") {
    const [{ data: employees }, { data: payslips }] = await Promise.all([
      supabase.from("profiles").select("*").eq("is_active", true).order("full_name").returns<Profile[]>(),
      supabase
        .from("payslips")
        .select("*")
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false })
        .returns<Payslip[]>(),
    ]);

    const employeeNames = new Map((employees ?? []).map((employee) => [employee.id, employee.full_name]));

    const downloadUrls = new Map<string, string>();
    const signedUrlResults = await Promise.all(
      (payslips ?? [])
        .filter((payslip) => payslip.pdf_url)
        .map(async (payslip) => ({
          id: payslip.id,
          result: await supabase.storage.from("payslips").createSignedUrl(payslip.pdf_url!, 60 * 10),
        }))
    );
    for (const { id, result } of signedUrlResults) {
      if (result.data?.signedUrl) downloadUrls.set(id, result.data.signedUrl);
    }

    return (
      <div>
        <PageHeader title="Slip Gaji" />
        <div className="space-y-6 p-4">
        <PayslipForm employees={employees ?? []} />

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Semua Slip Gaji</h2>
          {(payslips ?? []).length === 0 && (
            <p className="text-sm text-gray-500">Belum ada slip gaji.</p>
          )}
          {(payslips ?? []).map((payslip) => (
            <div key={payslip.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {employeeNames.get(payslip.user_id) ?? "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payslip.payslip_type} · {periodLabel(payslip.period_month, payslip.period_year)}
                  </p>
                </div>
                {payslip.is_draft && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Draft
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-600">THP: {formatIDR(payslip.take_home_pay)}</p>

              <div className="mt-2 flex items-center gap-3">
                {downloadUrls.has(payslip.id) && (
                  <a
                    href={downloadUrls.get(payslip.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-navy underline"
                  >
                    Unduh PDF
                  </a>
                )}
                {payslip.is_draft && <PublishButton payslipId={payslip.id} />}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  const { data: payslips } = await supabase
    .from("payslips")
    .select("*")
    .eq("user_id", user!.id)
    .eq("is_draft", false)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .returns<Payslip[]>();

  const downloadUrls = new Map<string, string>();
  const signedUrlResults = await Promise.all(
    (payslips ?? [])
      .filter((payslip) => payslip.pdf_url)
      .map(async (payslip) => ({
        id: payslip.id,
        result: await supabase.storage.from("payslips").createSignedUrl(payslip.pdf_url!, 60 * 10),
      }))
  );
  for (const { id, result } of signedUrlResults) {
    if (result.data?.signedUrl) downloadUrls.set(id, result.data.signedUrl);
  }

  return (
    <div>
      <PageHeader title="Slip Gaji" />
      <div className="space-y-2 p-4">
        {(payslips ?? []).length === 0 && (
          <p className="text-sm text-gray-500">Belum ada slip gaji.</p>
        )}
        {(payslips ?? []).map((payslip) => (
          <div key={payslip.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-sm font-medium text-gray-900">
              {payslip.payslip_type} · {periodLabel(payslip.period_month, payslip.period_year)}
            </p>
            <dl className="mt-2 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>Gaji Kotor</dt>
                <dd>{formatIDR(payslip.gross_income)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Total Potongan</dt>
                <dd>-{formatIDR(payslip.total_deductions)}</dd>
              </div>
              <div className="flex justify-between font-medium text-gray-900">
                <dt>Take Home Pay</dt>
                <dd>{formatIDR(payslip.take_home_pay)}</dd>
              </div>
            </dl>
            {downloadUrls.has(payslip.id) && (
              <a
                href={downloadUrls.get(payslip.id)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-brand-navy underline"
              >
                Unduh PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
