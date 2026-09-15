import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { JobTitle, OfficeLocation, Profile, WorkShift } from "@/types/database";
import { EmployeeCreateForm } from "../EmployeeCreateForm";

export default async function NewEmployeePage() {
  const supabase = await createClient();

  const [{ data: jobTitles }, { data: supervisors }, { data: officeLocations }, { data: shifts }] =
    await Promise.all([
      supabase.from("job_titles").select("*").order("name").returns<JobTitle[]>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "supervisor")
        .eq("is_active", true)
        .order("full_name")
        .returns<Profile[]>(),
      supabase.from("office_locations").select("*").order("name").returns<OfficeLocation[]>(),
      supabase.from("work_shifts").select("*").order("start_time").returns<WorkShift[]>(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/karyawan" className="text-sm text-brand-navy hover:underline">
          &larr; Daftar Karyawan
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Tambah Karyawan</h1>
        <p className="text-sm text-gray-500">Data ini akan langsung membuat akun login untuk karyawan.</p>
      </div>

      <EmployeeCreateForm
        jobTitles={jobTitles ?? []}
        supervisors={supervisors ?? []}
        officeLocations={officeLocations ?? []}
        shifts={shifts ?? []}
      />
    </div>
  );
}
