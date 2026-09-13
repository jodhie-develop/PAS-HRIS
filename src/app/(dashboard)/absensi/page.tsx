import { createClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/date";
import type { Attendance } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { CheckInOutForm } from "./CheckInOutForm";

export default async function AbsensiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: attendance } = await supabase
    .from("attendances")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", todayInJakarta())
    .maybeSingle<Attendance>();

  return (
    <div>
      <PageHeader title="Kehadiran" />
      <div className="p-4">
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="mt-4">
          <CheckInOutForm attendance={attendance ?? null} />
        </div>
      </div>
    </div>
  );
}
