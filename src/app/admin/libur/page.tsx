import { createClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/date";
import type { PublicHoliday } from "@/types/database";
import { HolidayForm } from "./HolidayForm";
import { HolidayRow } from "./HolidayRow";

export default async function HolidayPage() {
  const supabase = await createClient();
  const year = Number(todayInJakarta().slice(0, 4));

  const { data: holidays } = await supabase
    .from("public_holidays")
    .select("*")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year + 1}-12-31`)
    .order("date")
    .returns<PublicHoliday[]>();

  const byYear = [year, year + 1].map((y) => ({
    year: y,
    holidays: (holidays ?? []).filter((h) => h.date.startsWith(`${y}-`)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Hari Libur</h1>
        <p className="text-sm text-gray-500">
          Tanggal merah &amp; cuti bersama. Hari-hari ini tidak memotong kuota cuti tahunan karyawan.
        </p>
      </div>

      <HolidayForm />

      {byYear.map(({ year: y, holidays: list }) => (
        <div key={y} className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Tahun {y} <span className="font-normal text-gray-500">({list.length} hari)</span>
          </h2>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-2 pr-3">Tanggal</th>
                <th className="pb-2 pr-3">Keterangan</th>
                <th className="pb-2 pr-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-sm text-gray-500">
                    Belum ada hari libur untuk tahun {y}.
                  </td>
                </tr>
              )}
              {list.map((holiday) => (
                <HolidayRow key={holiday.date} holiday={holiday} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
