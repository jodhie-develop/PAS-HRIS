import { createClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/date";
import type { Attendance, OfficeLocation, Profile } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { AbsensiClient } from "./AbsensiClient";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  let office: OfficeLocation | null = null;
  if (profile?.office_location_id) {
    const { data } = await supabase
      .from("office_locations")
      .select("*")
      .eq("id", profile.office_location_id)
      .single<OfficeLocation>();
    office = data ?? null;
  }

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

        <AbsensiClient office={office} attendance={attendance ?? null} />
      </div>
    </div>
  );
}
