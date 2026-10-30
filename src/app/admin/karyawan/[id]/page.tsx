import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppDocument, JobTitle, OfficeLocation, Profile, WorkShift } from "@/types/database";
import { EmployeeEditForm } from "../EmployeeEditForm";
import { ResetPasswordButton } from "../ResetPasswordButton";
import { EmployeeDocuments } from "./EmployeeDocuments";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: jobTitles }, { data: supervisors }, { data: officeLocations }, { data: shifts }, { data: documents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
      supabase.from("job_titles").select("*").order("name").returns<JobTitle[]>(),
      supabase
        .from("profiles")
        .select("*")
        // HR admins can approve anyone's leave, so they may be a direct
        // superior too, not just users with the supervisor role.
        .in("role", ["supervisor", "hr_admin"])
        .eq("is_active", true)
        .order("full_name")
        .returns<Profile[]>(),
      supabase.from("office_locations").select("*").order("name").returns<OfficeLocation[]>(),
      supabase.from("work_shifts").select("*").order("start_time").returns<WorkShift[]>(),
      supabase.from("documents").select("*").eq("user_id", id).order("created_at", { ascending: false }).returns<AppDocument[]>(),
    ]);

  if (!employee) {
    notFound();
  }

  const downloadUrls: Record<string, string> = {};
  await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(document.file_url, 60 * 10);
    if (data?.signedUrl) downloadUrls[document.id] = data.signedUrl;
  }));

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

      <ResetPasswordButton employeeId={employee.id} />

      <EmployeeEditForm
        employee={employee}
        companyEmail={companyEmail}
        jobTitles={jobTitles ?? []}
        supervisors={supervisors ?? []}
        officeLocations={officeLocations ?? []}
        shifts={shifts ?? []}
      />

      <EmployeeDocuments employeeId={employee.id} documents={documents ?? []} downloadUrls={downloadUrls} />
    </div>
  );
}
