import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import type { AppDocument, Profile } from "@/types/database";
import { DocumentForm } from "./DocumentForm";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>(),
    supabase.from("documents").select("*").order("created_at", { ascending: false }).returns<AppDocument[]>(),
  ]);

  const downloadUrls = new Map<string, string>();
  const signedUrlResults = await Promise.all(
    (documents ?? []).map(async (document) => ({
      id: document.id,
      result: await supabase.storage.from("documents").createSignedUrl(document.file_url, 60 * 10),
    }))
  );
  for (const { id, result } of signedUrlResults) {
    if (result.data?.signedUrl) downloadUrls.set(id, result.data.signedUrl);
  }

  return (
    <div>
      <PageHeader title="Dokumen" />
      <div className="space-y-6 p-4">
        {profile?.role === "hr_admin" && <DocumentForm />}

        <div className="space-y-2">
          {(documents ?? []).length === 0 && (
            <p className="text-sm text-gray-500">Belum ada dokumen.</p>
          )}
          {(documents ?? []).map((document) => (
            <a
              key={document.id}
              href={downloadUrls.get(document.id) ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{document.title}</p>
                {document.category && <p className="text-xs text-gray-500">{document.category}</p>}
              </div>
              <span className="text-xs text-brand-navy underline">Unduh</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
