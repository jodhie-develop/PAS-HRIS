"use client";

import { useState, useTransition } from "react";
import type { LeaveRequest, LeaveType } from "@/types/database";
import { approveLeave, rejectLeave } from "./actions";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  cuti: "Cuti Tahunan",
  sakit: "Sakit",
  ijin: "Ijin",
  dinas_luar_kota: "Dinas Luar Kota",
  lainnya: "Lainnya",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApprovalRow({
  request,
  requesterName,
  documentUrl,
}: {
  request: LeaveRequest;
  requesterName: string;
  documentUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveLeave(request.id);
      if (result.error) setError(result.error);
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectLeave(request.id, rejectionReason);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{requesterName}</p>
          <p className="text-xs text-gray-500">
            {LEAVE_TYPE_LABELS[request.leave_type]} · {formatDate(request.start_date)} -{" "}
            {formatDate(request.end_date)}
          </p>
        </div>
      </div>

      {request.reason && <p className="mt-2 text-sm text-gray-600">{request.reason}</p>}

      {documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-brand-navy underline"
        >
          Lihat dokumen
        </a>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!showRejectForm ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleApprove}
            className="flex-1 rounded-md bg-brand-red px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Setujui
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowRejectForm(true)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
          >
            Tolak
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Alasan penolakan"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleReject}
              className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Kirim Penolakan
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowRejectForm(false)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
