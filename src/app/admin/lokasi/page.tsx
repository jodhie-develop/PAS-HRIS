import { createClient } from "@/lib/supabase/server";
import type { OfficeLocation } from "@/types/database";
import { OfficeLocationForm } from "./OfficeLocationForm";
import { OfficeLocationCard } from "./OfficeLocationCard";

export default async function OfficeLocationPage() {
  const supabase = await createClient();
  const { data: offices } = await supabase
    .from("office_locations")
    .select("*")
    .order("name")
    .returns<OfficeLocation[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Lokasi Kantor</h1>
        <p className="text-sm text-gray-500">Kelola kantor pusat dan cabang untuk validasi absensi GPS.</p>
      </div>

      <OfficeLocationForm />

      <div className="grid gap-4 lg:grid-cols-2">
        {(offices ?? []).length === 0 && (
          <p className="text-sm text-gray-500">Belum ada lokasi kantor.</p>
        )}
        {(offices ?? []).map((office) => (
          <OfficeLocationCard key={office.id} office={office} />
        ))}
      </div>
    </div>
  );
}
