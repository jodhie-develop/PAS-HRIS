import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobTitle, OfficeLocation, Profile, WorkShift } from "@/types/database";
import { EmployeeEditForm } from "../EmployeeEditForm";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: jobTitles }, { data: supervisors }, { data: officeLocations }, { data: shifts }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
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

  if (!employee) {
    notFound();
  }

  // Fetching the login email needs the service-role key, which is only
  // required for this one field — don't let a missing/misconfigured key
  // (e.g. not set in the deploy environment) take down the whole edit page.
  let companyEmail = "";
  try {
    const supabaseAdmin = createAdminClient();
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    companyEmail = authUser.user?.email ?? "";
  } catch {
    companyEmail = "";
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/karyawan" className="text-sm text-brand-navy hover:underline">
          &larr; Daftar Karyawan
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Edit Karyawan</h1>
        <p className="text-sm text-gray-500">
          {employee.full_name} · NIK {employee.nik}
        </p>
      </div>

      <EmployeeEditForm
        employee={employee}
        companyEmail={companyEmail}
        jobTitles={jobTitles ?? []}
        supervisors={supervisors ?? []}
        officeLocations={officeLocations ?? []}
        shifts={shifts ?? []}
      />
    </div>
  );
}
