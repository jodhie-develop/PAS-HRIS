import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import type { Attendance } from "@/types/database";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AttendanceHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: records } = await supabase
    .from("attendances")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false })
    .limit(30)
    .returns<Attendance[]>();

  return (
    <div>
      <PageHeader title="Cat Kehadiran" />
      <div className="space-y-2 p-4">
        {(records ?? []).length === 0 && (
          <p className="text-sm text-gray-500">Belum ada riwayat kehadiran.</p>
        )}
        {(records ?? []).map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDate(record.date)}</p>
              {record.notes && <p className="text-xs text-gray-500">{record.notes}</p>}
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-600">Masuk {formatTime(record.check_in)}</p>
              <p className="text-gray-600">Pulang {formatTime(record.check_out)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
