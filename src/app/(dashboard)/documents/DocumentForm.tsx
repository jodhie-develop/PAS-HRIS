"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDocument, type DocumentFormState } from "./actions";

const initialState: DocumentFormState = { error: null, success: false };

export function DocumentForm() {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<DocumentFormState>(initialState);

  const busy = uploading || isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;
    formData.delete("file");

    if (!file || file.size === 0) {
      setState({ error: "Pilih file terlebih dahulu.", success: false });
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    setUploading(false);

    if (uploadError) {
      setState({ error: "Gagal mengunggah file. Coba lagi.", success: false });
      return;
    }
    formData.set("file_path", path);

    startTransition(async () => {
      const result = await createDocument(initialState, formData);
      setState(result);
      if (result.success) {
        form.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Judul
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Kategori (opsional)
        </label>
        <input
          id="category"
          name="category"
          type="text"
          placeholder="Peraturan / Formulir / Lainnya"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
          File
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,.doc,.docx"
          className="mt-1 w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">PDF/JPG/PNG/DOC, maks 10MB.</p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Dokumen berhasil diunggah.</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {uploading ? "Mengunggah..." : isPending ? "Menyimpan..." : "Unggah Dokumen"}
      </button>
    </form>
  );
}
