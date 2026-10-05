"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type CaptureSelfie = () => Promise<Blob>;

const MAX_WIDTH = 720;
const JPEG_QUALITY = 0.8;

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser, lalu muat ulang halaman.";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "Kamera tidak ditemukan di perangkat ini.";
    }
    if (error.name === "NotReadableError") {
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu muat ulang halaman.";
    }
  }
  return "Tidak bisa membuka kamera. Muat ulang halaman dan coba lagi.";
}

// Live front-camera preview. Photos come only from this stream (never the
// gallery), and each one is stamped with the employee's name and the
// capture time so a reused picture is easy to spot.
export function SelfieCamera({
  captureRef,
  stampName,
}: {
  captureRef: RefObject<CaptureSelfie | null>;
  stampName: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"starting" | "ready" | "error">("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const capture = useCallback<CaptureSelfie>(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.reject(new Error("Kamera belum siap."));

    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, width, height);

    const stamp = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const fontSize = Math.max(14, Math.round(width / 28));
    const barHeight = fontSize * 2 + 16;
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(stampName, 12, height - barHeight + 6);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(`${stamp} WIB`, 12, height - barHeight + 8 + fontSize);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal memproses foto."));
            return;
          }
          setSnapshot(URL.createObjectURL(blob));
          resolve(blob);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    });
  }, [stampName]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Browser ini tidak mendukung kamera. Buka lewat Chrome / Safari dengan alamat https://");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        const video = videoRef.current;
        if (video) {
          video.srcObject = media;
          video.play().catch(() => {});
        }
        setStatus("ready");
        captureRef.current = capture;
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(cameraErrorMessage(error));
      });

    return () => {
      cancelled = true;
      captureRef.current = null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [capture, captureRef]);

  // Release the previous thumbnail's blob URL whenever a new one replaces it.
  useEffect(() => {
    return () => {
      if (snapshot) URL.revokeObjectURL(snapshot);
    };
  }, [snapshot]);

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-gray-900">
      {/* Mirrored like a normal selfie preview; the saved photo is not mirrored. */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full -scale-x-100 object-cover"
      />
      {snapshot && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: URL of the photo just taken
        <img
          src={snapshot}
          alt="Foto selfie terakhir"
          className="absolute right-2 bottom-2 w-1/4 rounded-lg border-2 border-white shadow-lg"
        />
      )}
      {status === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-300">
          Membuka kamera...
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
