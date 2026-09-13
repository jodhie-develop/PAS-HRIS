"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAnnouncement, type AnnouncementFormState } from "./actions";

const initialState: AnnouncementFormState = { error: null, success: false };

export function AnnouncementForm() {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<AnnouncementFormState>(initialState);

  const busy = uploading || isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("attachment") as File | null;
    formData.delete("attachment");

    if (file && file.size > 0) {
      setUploading(true);
      const supabase = createClient();
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("announcements")
        .upload(path, file);
      setUploading(false);

      if (uploadError) {
        setState({ error: "Gagal mengunggah lampiran. Coba lagi.", success: false });
        return;
      }
      formData.set("file_path", path);
    }

    startTransition(async () => {
      const result = await createAnnouncement(initialState, formData);
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
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Isi
        </label>
        <textarea
          id="content"
          name="content"
          rows={4}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">
          Lampiran (opsional)
        </label>
        <input
          id="attachment"
          name="attachment"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="mt-1 w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">PDF/JPG/PNG, maks 5MB.</p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Pengumuman berhasil dibuat.</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {uploading ? "Mengunggah lampiran..." : isPending ? "Mengirim..." : "Publikasikan"}
      </button>
    </form>
  );
}
