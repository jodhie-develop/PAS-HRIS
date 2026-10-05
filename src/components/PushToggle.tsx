"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/(dashboard)/notifications/push-actions";
import { IconBell } from "@/components/icons";

type PushState =
  | "checking"
  | "unsupported" // browser has no Web Push (e.g. iPhone Safari tab, not installed)
  | "no-worker" // service worker not registered (local dev)
  | "denied"
  | "off"
  | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function readState(): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return "no-worker";
  if (Notification.permission === "denied") return "denied";
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

// `compact` renders a slim banner for the home page that hides itself once
// push is on (or can't be enabled); otherwise a full settings card.
export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readState().then(setState).catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }));
      const result = await savePushSubscription(subscription.toJSON(), navigator.userAgent);
      if (result.error) {
        setError(result.error);
        return;
      }
      setState("on");
    } catch {
      setError("Gagal mengaktifkan notifikasi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setError("Gagal menonaktifkan notifikasi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    if (state !== "off") return null;
    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-navy/20 bg-white p-3 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-brand-navy">
          <IconBell className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-xs text-gray-700">
          Aktifkan notifikasi supaya pengajuan cuti &amp; keterlambatan tim langsung muncul di HP ini.
          {error && <span className="mt-1 block text-brand-red">{error}</span>}
        </p>
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="shrink-0 rounded-full bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {busy ? "..." : "Aktifkan"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Notifikasi di HP ini</p>
          <p className="text-xs text-gray-500">
            {state === "on"
              ? "Aktif — notifikasi muncul walaupun aplikasi ditutup."
              : state === "checking"
                ? "Memeriksa..."
                : "Nonaktif"}
          </p>
        </div>
        {(state === "off" || state === "on") && (
          <button
            type="button"
            onClick={state === "on" ? disable : enable}
            disabled={busy}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60 ${
              state === "on" ? "border border-gray-300 text-gray-700" : "bg-brand-red text-white"
            }`}
          >
            {busy ? "Memproses..." : state === "on" ? "Matikan" : "Aktifkan"}
          </button>
        )}
      </div>

      {state === "unsupported" && (
        <p className="mt-2 rounded-lg bg-brand-cream px-3 py-2 text-xs text-gray-700">
          {isIos()
            ? "Di iPhone, notifikasi hanya bisa aktif jika aplikasi sudah dipasang: buka di Safari, ketuk Bagikan → Tambah ke Layar Utama, lalu buka PAS HRIS dari ikon di layar utama (iOS 16.4 ke atas)."
            : "Browser ini tidak mendukung notifikasi. Gunakan Google Chrome."}
        </p>
      )}
      {state === "no-worker" && (
        <p className="mt-2 rounded-lg bg-brand-cream px-3 py-2 text-xs text-gray-700">
          Notifikasi HP hanya tersedia di versi online (pas-hris.vercel.app), bukan di mode pengembangan.
        </p>
      )}
      {state === "denied" && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-brand-red">
          Izin notifikasi diblokir. Buka pengaturan browser / aplikasi → Notifikasi → izinkan untuk PAS HRIS, lalu
          muat ulang halaman.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}
    </div>
  );
}
