"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitLeaveRequest, type LeaveFormState } from "./actions";
import type { LeaveType } from "@/types/database";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  cuti: "Cuti Tahunan",
  sakit: "Sakit",
  ijin: "Ijin",
  dinas_luar_kota: "Dinas Luar Kota",
  lainnya: "Lainnya",
};

const initialState: LeaveFormState = { error: null, success: false };

export function LeaveRequestForm({ userId }: { userId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<LeaveFormState>(initialState);

  const busy = uploading || isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("document") as File | null;
    formData.delete("document");

    if (file && file.size > 0) {
      setUploading(true);
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("leave-documents")
        .upload(path, file);
      setUploading(false);

      if (uploadError) {
        setState({ error: "Gagal mengunggah dokumen. Coba lagi.", success: false });
        return;
      }
      formData.set("document_path", path);
    }

    startTransition(async () => {
      const result = await submitLeaveRequest(initialState, formData);
      setState(result);
      if (result.success) {
        form.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700">
          Jenis
        </label>
        <select
          id="leave_type"
          name="leave_type"
          required
          defaultValue="cuti"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Mulai
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            Selesai
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Alasan
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="document" className="block text-sm font-medium text-gray-700">
          Dokumen pendukung (opsional)
        </label>
        <input
          id="document"
          name="document"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="mt-1 w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">PDF/JPG/PNG, maks 5MB.</p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Pengajuan berhasil dikirim.</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {uploading ? "Mengunggah dokumen..." : isPending ? "Mengirim..." : "Ajukan"}
      </button>
    </form>
  );
}
