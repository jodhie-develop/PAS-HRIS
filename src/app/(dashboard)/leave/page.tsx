import { createClient } from "@/lib/supabase/server";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { LeaveRequestForm } from "./LeaveRequestForm";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  cuti: "Cuti Tahunan",
  sakit: "Sakit",
  ijin: "Ijin",
  dinas_luar_kota: "Dinas Luar Kota",
  lainnya: "Lainnya",
};

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

  const { data: requests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user!.id)
    .order("start_date", { ascending: false })
    .returns<LeaveRequest[]>();

  const documentUrls = new Map<string, string>();
  for (const request of requests ?? []) {
    if (request.document_url) {
      const { data } = await supabase.storage
        .from("leave-documents")
        .createSignedUrl(request.document_url, 60 * 10);
      if (data?.signedUrl) {
        documentUrls.set(request.id, data.signedUrl);
      }
    }
  }

  return (
    <div>
      <PageHeader title="Ijin / Cuti" />
      <div className="space-y-6 p-4">
        <LeaveRequestForm userId={user!.id} />

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
