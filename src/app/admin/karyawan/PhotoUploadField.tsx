"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PhotoUploadField({ initialUrl }: { initialUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadError) {
      setError("Gagal mengunggah foto. Coba lagi.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setUrl(data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Foto Pribadi</label>
      <div className="mt-1 flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL, not a domain we can whitelist ahead of time
          <img
            src={preview}
            alt="Pratinjau foto"
            className="h-16 w-16 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full border border-gray-200 bg-gray-100" />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="text-sm"
        />
      </div>
      {uploading && <p className="mt-1 text-xs text-gray-500">Mengunggah...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input type="hidden" name="avatar_url" value={url ?? ""} />
    </div>
  );
}
