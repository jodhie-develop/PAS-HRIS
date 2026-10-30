import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { DocumentType } from "@/types/database";
import { DocumentTypesManager } from "./DocumentTypesManager";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data: types } = await supabase.from("document_types").select("*").order("name").returns<DocumentType[]>();
  return <div>
    <PageHeader title="Jenis Dokumen" />
    <div className="space-y-5 p-4">
      <p className="text-sm text-gray-600">Kelola pilihan jenis dokumen yang tersedia pada menu Dokumen karyawan.</p>
      <DocumentTypesManager types={types ?? []} />
    </div>
  </div>;
}
