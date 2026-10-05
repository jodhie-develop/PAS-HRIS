// Custom service-worker code. next-pwa bundles this file and imports it into
// the generated public/sw.js (production builds only — the PWA layer is
// disabled in `next dev`). It runs even when the app is closed.

type PushPayload = { title: string; body?: string; url?: string; tag?: string };

// Minimal shapes of the service-worker globals used here, so this file
// type-checks under the app's DOM lib without pulling in the webworker lib.
type ExtendableEvent = Event & { waitUntil(promise: Promise<unknown>): void };
type PushEvent = ExtendableEvent & { data: { json(): unknown } | null };
type NotificationEvent = ExtendableEvent & { notification: Notification & { data?: { url?: string } } };
type WindowClient = { url: string; focus(): Promise<unknown>; navigate(url: string): Promise<unknown> };
type ServiceWorkerScope = {
  addEventListener(type: "push", listener: (event: PushEvent) => void): void;
  addEventListener(type: "notificationclick", listener: (event: NotificationEvent) => void): void;
  registration: { showNotification(title: string, options?: NotificationOptions): Promise<void> };
  clients: {
    matchAll(options: { type: "window"; includeUncontrolled: boolean }): Promise<WindowClient[]>;
    openWindow(url: string): Promise<unknown>;
  };
  location: { origin: string };
};

const sw = self as unknown as ServiceWorkerScope;

sw.addEventListener("push", (event) => {
  let payload: PushPayload = { title: "PAS HRIS" };
  try {
    payload = { ...payload, ...(event.data?.json() as PushPayload) };
  } catch {
    // Non-JSON payload: fall back to the generic title.
  }

  event.waitUntil(
    sw.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url ?? "/notifications" },
    })
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? "/notifications", sw.location.origin).href;

  event.waitUntil(
    (async () => {
      // Reuse an open PAS HRIS window if there is one, else open a new one.
      const windows = await sw.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((client) => client.url.startsWith(sw.location.origin));
      if (existing) {
        await existing.navigate(target);
        await existing.focus();
        return;
      }
      await sw.clients.openWindow(target);
    })()
  );
});

export {};
