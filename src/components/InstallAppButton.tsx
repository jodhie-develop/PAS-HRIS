"use client";

import { useState, useSyncExternalStore } from "react";
import { IconDownload, IconMoreVertical, IconPlusSquare, IconShareIos } from "@/components/icons";

// Chrome/Edge/Samsung Internet fire `beforeinstallprompt` once per page load
// when the app is installable. It isn't in TypeScript's DOM lib yet.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallMode = "hidden" | "prompt" | "ios" | "manual";

// Kept at module scope (not component state) so the captured event survives
// navigating away from the home page and back — the browser won't fire it again.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; touch support gives it away.
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getSnapshot(): InstallMode {
  if (installed || isStandalone()) return "hidden";
  if (deferredPrompt) return "prompt";
  if (isIos()) return "ios";
  return "manual";
}

function getServerSnapshot(): InstallMode {
  return "hidden";
}

export default function InstallAppButton() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showGuide, setShowGuide] = useState(false);

  if (mode === "hidden") return null;

  async function handleClick() {
    if (mode === "prompt" && deferredPrompt) {
      const event = deferredPrompt;
      await event.prompt();
      await event.userChoice;
      // A prompt event can only be used once.
      deferredPrompt = null;
      notify();
      return;
    }
    setShowGuide(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:bg-brand-red-dark hover:shadow-md active:translate-y-0 active:shadow-sm"
      >
        <IconDownload className="h-4 w-4" />
        Add to your device
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setShowGuide(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-guide-title"
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-8 shadow-xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="install-guide-title" className="text-base font-semibold text-gray-900">
              Pasang PAS HRIS di {mode === "ios" ? "iPhone" : "HP"} Anda
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Aplikasi akan muncul di layar utama seperti aplikasi biasa.
            </p>

            <ol className="mt-5 space-y-4 text-sm text-gray-800">
              {mode === "ios" ? (
                <>
                  <Step number={1}>
                    Ketuk tombol <b>Bagikan</b>{" "}
                    <IconShareIos className="inline h-5 w-5 align-text-bottom text-brand-navy" /> di bagian
                    bawah Safari.
                  </Step>
                  <Step number={2}>
                    Gulir ke bawah, pilih <b>Tambah ke Layar Utama</b>{" "}
                    <IconPlusSquare className="inline h-5 w-5 align-text-bottom text-brand-navy" />.
                  </Step>
                  <Step number={3}>
                    Ketuk <b>Tambah</b> di pojok kanan atas.
                  </Step>
                </>
              ) : (
                <>
                  <Step number={1}>
                    Ketuk menu{" "}
                    <IconMoreVertical className="inline h-5 w-5 align-text-bottom text-brand-navy" /> di pojok
                    kanan atas browser.
                  </Step>
                  <Step number={2}>
                    Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.
                  </Step>
                  <Step number={3}>
                    Ketuk <b>Instal</b> / <b>Tambahkan</b> untuk konfirmasi.
                  </Step>
                </>
              )}
            </ol>

            <p className="mt-5 rounded-xl bg-brand-cream px-3 py-2 text-xs text-gray-700">
              {mode === "ios"
                ? "Jika tombol Bagikan tidak ada (misalnya dibuka dari WhatsApp), buka halaman ini di Safari terlebih dahulu."
                : "Jika menu tersebut tidak ada (misalnya dibuka dari WhatsApp), buka halaman ini di Google Chrome terlebih dahulu."}
            </p>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-semibold text-white">
        {number}
      </span>
      <span className="leading-6">{children}</span>
    </li>
  );
}
