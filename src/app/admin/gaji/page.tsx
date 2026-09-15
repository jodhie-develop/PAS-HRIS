import { createClient } from "@/lib/supabase/server";
import type { JobTitle, Salary } from "@/types/database";
import { SalaryForm } from "./SalaryForm";
import { SalaryRow } from "./SalaryRow";

export default async function SalaryPage() {
  const supabase = await createClient();

  const { data: jobTitles } = await supabase
    .from("job_titles")
    .select("*")
    .order("name")
    .returns<JobTitle[]>();

  const { data: salaries } = await supabase
    .from("salaries")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Salary[]>();

  const jobTitleNames = new Map((jobTitles ?? []).map((jobTitle) => [jobTitle.id, jobTitle.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Gaji</h1>
        <p className="text-sm text-gray-500">Atur gaji pokok berdasarkan jabatan.</p>
      </div>

      <SalaryForm jobTitles={jobTitles ?? []} />

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-3">Jabatan</th>
              <th className="pb-2 pr-3">Gaji Pokok</th>
              <th className="pb-2 pr-3">Catatan</th>
              <th className="pb-2 pr-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(salaries ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-sm text-gray-500">
                  Belum ada data gaji.
                </td>
              </tr>
            )}
            {(salaries ?? []).map((salary) => (
              <SalaryRow
                key={salary.id}
                salary={salary}
                jobTitleName={jobTitleNames.get(salary.job_title_id) ?? "-"}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
