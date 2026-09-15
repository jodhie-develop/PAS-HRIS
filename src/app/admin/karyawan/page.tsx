import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { JobTitle, Profile } from "@/types/database";
import { EmployeeTable, type EmployeeRow } from "./EmployeeTable";

export default async function EmployeesPage() {
  const supabase = await createClient();

  const [{ data: employees }, { data: jobTitles }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name").returns<Profile[]>(),
    supabase.from("job_titles").select("*").returns<JobTitle[]>(),
  ]);

  const jobTitleNames = new Map((jobTitles ?? []).map((jobTitle) => [jobTitle.id, jobTitle.name]));
  const profileNames = new Map((employees ?? []).map((employee) => [employee.id, employee.full_name]));

  const rows: EmployeeRow[] = (employees ?? []).map((employee) => ({
    id: employee.id,
    full_name: employee.full_name,
    nik: employee.nik,
    jobTitleName: employee.job_title_id ? jobTitleNames.get(employee.job_title_id) ?? "-" : employee.job_title ?? "-",
    role: employee.role,
    supervisorName: employee.supervisor_id ? profileNames.get(employee.supervisor_id) ?? "-" : "-",
    is_active: employee.is_active,
    avatar_url: employee.avatar_url,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Master Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola data dan akun login karyawan.</p>
        </div>
        <Link
          href="/admin/karyawan/baru"
          className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white"
        >
          + Tambah Karyawan
        </Link>
      </div>

      <EmployeeTable employees={rows} />
    </div>
  );
}
