import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { markAllNotificationsRead } from "./actions";
import { NotificationItem } from "./NotificationItem";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<AppNotification[]>();

  const list = notifications ?? [];
  const unreadCount = list.filter((n) => !n.read_at).length;

  return (
    <div>
      <PageHeader title="Notifikasi" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
          </p>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="text-xs font-medium text-brand-navy hover:underline">
                Tandai semua dibaca
              </button>
            </form>
          )}
        </div>

        {list.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Belum ada notifikasi.
          </p>
        )}
        {list.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
