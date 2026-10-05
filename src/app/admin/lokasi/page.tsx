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

  const officeList = offices ?? [];
  const [{ data: assigned }, attendanceCounts] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, office_location_id")
      .not("office_location_id", "is", null)
      .returns<{ full_name: string; office_location_id: string }[]>(),
    Promise.all(
      officeList.map((office) =>
        supabase
          .from("attendances")
          .select("id", { count: "exact", head: true })
          .eq("office_location_id", office.id)
          .then(({ count }) => [office.id, count ?? 0] as const)
      )
    ),
  ]);
  const attendanceCountByOffice = new Map(attendanceCounts);
  const employeesByOffice = new Map<string, string[]>();
  for (const employee of assigned ?? []) {
    const names = employeesByOffice.get(employee.office_location_id) ?? [];
    names.push(employee.full_name);
    employeesByOffice.set(employee.office_location_id, names);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Lokasi Kantor</h1>
        <p className="text-sm text-gray-500">Kelola kantor pusat dan cabang untuk validasi absensi GPS.</p>
      </div>

      <OfficeLocationForm />

      <div className="grid gap-4 lg:grid-cols-2">
        {officeList.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada lokasi kantor.</p>
        )}
        {officeList.map((office) => (
          <OfficeLocationCard
            key={office.id}
            office={office}
            employeeNames={employeesByOffice.get(office.id) ?? []}
            attendanceCount={attendanceCountByOffice.get(office.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
