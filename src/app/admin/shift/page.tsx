import { createClient } from "@/lib/supabase/server";
import type { WorkShift } from "@/types/database";
import { ShiftForm } from "./ShiftForm";
import { ShiftRow } from "./ShiftRow";

export default async function ShiftPage() {
  const supabase = await createClient();
  const { data: shifts } = await supabase
    .from("work_shifts")
    .select("*")
    .order("start_time")
    .returns<WorkShift[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Shift</h1>
        <p className="text-sm text-gray-500">Kelola jam kerja yang bisa dipakai karyawan.</p>
      </div>

      <ShiftForm />

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-3">Nama Shift</th>
              <th className="pb-2 pr-3">Mulai</th>
              <th className="pb-2 pr-3">Selesai</th>
              <th className="pb-2 pr-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(shifts ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-sm text-gray-500">
                  Belum ada shift.
                </td>
              </tr>
            )}
            {(shifts ?? []).map((shift) => (
              <ShiftRow key={shift.id} shift={shift} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
