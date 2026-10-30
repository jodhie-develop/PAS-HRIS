"use client";

import { useActionState, useState, useTransition } from "react";
import type { DocumentType } from "@/types/database";
import { createDocumentType, deleteDocumentType, type DocumentTypeActionState } from "./actions";

const initial: DocumentTypeActionState = { error: null, success: false };

export function DocumentTypesManager({ types }: { types: DocumentType[] }) {
  const [state, formAction, pending] = useActionState(createDocumentType, initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteDocumentType(id);
      if (result.error) setError(result.error);
    });
  }

  return <div className="space-y-6">
    <form action={formAction} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Tambah Pilihan Dokumen</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="name" required maxLength={80} placeholder="Contoh: KTP" className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" disabled={pending} className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? "Menyimpan..." : "Tambah Jenis"}</button>
      </div>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Jenis dokumen berhasil ditambahkan.</p>}
    </form>
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    <div className="space-y-2">
      {types.map((type) => <div key={type.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-gray-900">{type.name}</span>
        <button type="button" disabled={isPending} onClick={() => remove(type.id)} className="text-sm text-red-600 hover:underline disabled:opacity-50">Hapus</button>
      </div>)}
      {types.length === 0 && <p className="text-sm text-gray-500">Belum ada jenis dokumen.</p>}
    </div>
  </div>;
}
