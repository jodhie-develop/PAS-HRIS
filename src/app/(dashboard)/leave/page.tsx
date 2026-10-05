import { createClient } from "@/lib/supabase/server";
import type { LeaveRequest, LeaveStatus, Profile } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { todayInJakarta } from "@/lib/date";
import { LEAVE_TYPE_LABELS, QUOTA_LEAVE_TYPE, computeLeaveBalance, countLeaveDays } from "@/lib/leave";
import { LeaveRequestForm } from "./LeaveRequestForm";

const STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function LeavePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const year = Number(todayInJakarta().slice(0, 4));

  const [{ data: requests }, { data: profile }, { data: holidayRows }] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", user!.id)
      .order("start_date", { ascending: false })
      .returns<LeaveRequest[]>(),
    supabase
      .from("profiles")
      .select("annual_leave_quota")
      .eq("id", user!.id)
      .single<Pick<Profile, "annual_leave_quota">>(),
    // This year and next, so a request planned for early next year previews correctly.
    supabase
      .from("public_holidays")
      .select("date")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year + 1}-12-31`),
  ]);

  const holidayDates = (holidayRows ?? []).map((row) => row.date);
  const holidays = new Set(holidayDates);
  const balances = [year, year + 1].map((y) =>
    computeLeaveBalance(requests ?? [], profile?.annual_leave_quota, holidays, y)
  );
  const balance = balances[0];

  const documentUrls = new Map<string, string>();
  const signedUrlResults = await Promise.all(
    (requests ?? [])
      .filter((request) => request.document_url)
      .map(async (request) => ({
        id: request.id,
        result: await supabase.storage.from("leave-documents").createSignedUrl(request.document_url!, 60 * 10),
      }))
  );
  for (const { id, result } of signedUrlResults) {
    if (result.data?.signedUrl) {
      documentUrls.set(id, result.data.signedUrl);
    }
  }

  return (
    <div>
      <PageHeader title="Ijin / Cuti" />
      <div className="space-y-6 p-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Sisa Cuti Tahunan {balance.year}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {Math.max(balance.remaining, 0)}
            <span className="text-base font-normal text-gray-500"> / {balance.quota} hari</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-brand-red"
              style={{ width: `${Math.min(100, (balance.used / Math.max(balance.quota, 1)) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Terpakai: {balance.used} hari</span>
            {balance.pending > 0 && <span>Menunggu persetujuan: {balance.pending} hari</span>}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Dihitung hari kerja Senin-Jumat, tanggal merah tidak memotong kuota. Reset tiap 1 Januari.
          </p>
        </div>

        <LeaveRequestForm userId={user!.id} holidayDates={holidayDates} balances={balances} />

        <div>
          <h2 className="text-sm font-semibold text-gray-900">Riwayat Pengajuan</h2>
          <div className="mt-2 space-y-2">
            {(requests ?? []).length === 0 && (
              <p className="text-sm text-gray-500">Belum ada pengajuan.</p>
            )}
            {(requests ?? []).map((request) => (
              <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {LEAVE_TYPE_LABELS[request.leave_type]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      {request.leave_type === QUOTA_LEAVE_TYPE &&
                        ` · ${countLeaveDays(request.start_date, request.end_date, holidays)} hari kerja`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status]}`}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>

                {request.reason && (
                  <p className="mt-2 text-sm text-gray-600">{request.reason}</p>
                )}

                {documentUrls.has(request.id) && (
                  <a
                    href={documentUrls.get(request.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-brand-navy underline"
                  >
                    Lihat dokumen
                  </a>
                )}

                {request.status === "rejected" && request.rejection_reason && (
                  <p className="mt-2 text-xs text-red-600">
                    Alasan penolakan: {request.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
