import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/push";
import type { AppNotificationInsert, Profile } from "@/types/database";

// Server-only. Notifications are inserted with the service-role client so
// the notifications table needs no INSERT policy — an employee can't forge
// one for their supervisor through the API.

// Who should hear about an employee's lateness / leave request: their
// supervisor, or every active HR admin when no supervisor is assigned.
export async function supervisorRecipients(employee: Pick<Profile, "id" | "supervisor_id">) {
  if (employee.supervisor_id && employee.supervisor_id !== employee.id) {
    return [employee.supervisor_id];
  }
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "hr_admin")
      .eq("is_active", true)
      .neq("id", employee.id);
    return (data ?? []).map((row) => row.id);
  } catch (error) {
    console.error("supervisorRecipients failed:", error);
    return [];
  }
}

// Best effort: a failed notification must never fail the check-in or leave
// request that triggered it, so errors are logged and swallowed.
export async function notify(
  recipientIds: string[],
  notification: Omit<AppNotificationInsert, "user_id">
) {
  if (recipientIds.length === 0) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("notifications")
      .insert(recipientIds.map((user_id) => ({ ...notification, user_id })));
    if (error) console.error("notify failed:", error.message);
  } catch (error) {
    console.error("notify failed:", error);
  }

  // Also pop it up on the recipients' phones, even with the app closed.
  try {
    await sendPush(recipientIds, {
      title: notification.title,
      body: notification.body ?? undefined,
      url: notification.link ?? "/notifications",
    });
  } catch (error) {
    console.error("push failed:", error);
  }
}
