"use client";

import { useState, useTransition } from "react";
import type { AppDocument } from "@/types/database";
import { acceptEmployeeDocument } from "./document-actions";

export function EmployeeDocuments({ employeeId, documents, downloadUrls }: {
  employeeId: string;
  documents: AppDocument[];
  downloadUrls: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept(documentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await acceptEmployeeDocument(employeeId, documentId);
      if (result.error) setError(result.error);
    });
  }

  return <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div>
      <h2 className="text-sm font-semibold text-gray-900">Dokumen Karyawan</h2>
      <p className="text-xs text-gray-500">Dokumen yang diunggah karyawan dan perlu ditinjau HR.</p>
    </div>
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    {documents.length === 0 ? <p className="text-sm text-gray-500">Belum ada dokumen yang diunggah.</p> : (
      <div className="space-y-2">
        {documents.map((document) => <div key={document.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{document.title}</p>
            <p className="text-xs text-gray-500">{document.category ?? "Dokumen"} · {new Date(document.created_at).toLocaleDateString("id-ID")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {downloadUrls[document.id] && <a href={downloadUrls[document.id]} target="_blank" rel="noreferrer" className="text-xs text-brand-navy underline">Lihat</a>}
            {document.status === "pending" ? <>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Pending</span>
              <button type="button" onClick={() => accept(document.id)} disabled={isPending} className="rounded-md bg-brand-red px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                {isPending ? "Memproses..." : "Accept"}
              </button>
            </> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Accepted</span>}
          </div>
        </div>)}
      </div>
    )}
  </section>;
}
