import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-only. Sends Web Push messages to every device a user has enabled.

let configured: boolean | null = null;

function configure() {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  configured = Boolean(publicKey && privateKey && subject);
  if (configured) webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  else console.error("Web push disabled: VAPID env vars are missing.");
  return configured;
}

export type PushMessage = { title: string; body?: string; url?: string; tag?: string };

export async function sendPush(userIds: string[], message: PushMessage) {
  if (userIds.length === 0 || !configure()) return;

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);
  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify(message);
  const expired: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: 60 * 60 * 24 }
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410: the browser dropped this subscription (app uninstalled,
        // permission revoked, ...). Forget it so we stop trying.
        if (status === 404 || status === 410) expired.push(subscription.endpoint);
        else console.error("sendPush failed:", status, (error as Error).message);
      }
    })
  );

  if (expired.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", expired);
  }
}
