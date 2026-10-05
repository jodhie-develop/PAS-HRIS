"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// push_subscriptions has RLS on with no user policies: every read/write
// goes through these actions with the service-role client, after checking
// who is logged in.

type SubscriptionJson = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function savePushSubscription(subscription: SubscriptionJson, userAgent: string) {
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys?.p256dh;
  const auth = subscription.keys?.auth;
  if (!endpoint?.startsWith("https://") || !p256dh || !auth) {
    return { error: "Data langganan notifikasi tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan masuk kembali." };

  try {
    const admin = createAdminClient();
    // One device = one owner: if someone else enabled push on this browser
    // before, the device now belongs to whoever is logged in.
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
    const { error } = await admin.from("push_subscriptions").insert({
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent.slice(0, 300) || null,
    });
    if (error) return { error: "Gagal menyimpan pengaturan notifikasi." };
  } catch {
    return { error: "Konfigurasi server belum lengkap. Hubungi developer." };
  }
  return { error: null };
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const admin = createAdminClient();
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  } catch {
    // Nothing to clean up if the server can't reach the table.
  }
}
