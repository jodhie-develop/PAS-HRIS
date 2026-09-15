import { createClient } from "@/lib/supabase/server";
import type { JobTitle } from "@/types/database";
import { JobTitleForm } from "./JobTitleForm";
import { JobTitleRow } from "./JobTitleRow";

export default async function JobTitlePage() {
  const supabase = await createClient();
  const { data: jobTitles } = await supabase
    .from("job_titles")
    .select("*")
    .order("name")
    .returns<JobTitle[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Jabatan</h1>
        <p className="text-sm text-gray-500">Kelola daftar jabatan yang tersedia di perusahaan.</p>
      </div>

      <JobTitleForm />

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-3">Nama Jabatan</th>
              <th className="pb-2 pr-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(jobTitles ?? []).length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-sm text-gray-500">
                  Belum ada jabatan.
                </td>
              </tr>
            )}
            {(jobTitles ?? []).map((jobTitle) => (
              <JobTitleRow key={jobTitle.id} jobTitle={jobTitle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
