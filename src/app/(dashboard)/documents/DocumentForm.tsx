"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDocument, type DocumentFormState } from "./actions";
import type { DocumentType } from "@/types/database";

type KtpFields = { nik: string; name: string; address: string };
const emptyKtp: KtpFields = { nik: "", name: "", address: "" };
const initialState: DocumentFormState = { error: null, success: false };

function parseKtpText(text: string): KtpFields {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const normalizedLines = lines.map((line) => line.replace(/[OQ]/g, "0").replace(/[Il|]/g, "1"));
  let nik = "";
  const nikLineIndex = normalizedLines.findIndex((line) => /N[I1]K/.test(line.toUpperCase()));
  if (nikLineIndex >= 0) {
    const sameLine = normalizedLines[nikLineIndex].replace(/.*?N[I1]K\s*[:.]?\s*/i, "").replace(/\D/g, "");
    nik = sameLine.length === 16 ? sameLine : "";
  }
  if (!nik) {
    nik = normalizedLines.map((line) => line.replace(/\D/g, "")).find((digits) => digits.length === 16) ?? "";
  }

  const nameLineIndex = normalizedLines.findIndex((line) => /^NAMA\b/i.test(line));
  let name = "";
  if (nameLineIndex >= 0) {
    name = normalizedLines[nameLineIndex].replace(/^NAMA\s*[:.]?\s*/i, "").trim();
    if (!name) name = normalizedLines[nameLineIndex + 1] ?? "";
    name = name.replace(/\s+(?:TEMPAT|TGL|JENIS KELAMIN|ALAMAT)\b.*$/i, "").trim();
  }

  const addressLineIndex = normalizedLines.findIndex((line) => /^ALAMAT\b/i.test(line));
  let address = "";
  if (addressLineIndex >= 0) {
    const first = normalizedLines[addressLineIndex].replace(/^ALAMAT\s*[:.]?\s*/i, "").trim();
    const addressLines = first ? [first] : [];
    for (const line of normalizedLines.slice(addressLineIndex + 1)) {
      if (/^(?:RT\s*[/|]?\s*RW|KEL(?:URAHAN)?\s*[/|]?\s*DESA|KECAMATAN|AGAMA|STATUS PERKAWINAN|PEKERJAAN)\b/i.test(line)) break;
      addressLines.push(line);
    }
    address = addressLines.join(" ").trim();
  }

  return { nik, name, address };
}

export function DocumentForm({ documentTypes }: { documentTypes: DocumentType[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<DocumentFormState>(initialState);
  const [category, setCategory] = useState("");
  const [ktp, setKtp] = useState<KtpFields>(emptyKtp);
  const [ocrMessage, setOcrMessage] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStream.current) {
      videoRef.current.srcObject = cameraStream.current;
    }
  }, [cameraOpen]);

  useEffect(() => () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const busy = uploading || isPending || ocrBusy || cameraLoading;

  function closeForm() {
    stopCamera();
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-md bg-brand-red px-3 py-2.5 text-sm font-medium text-white">
        Unggah Dokumen
      </button>
    );
  }

  async function readKtp(file: File) {
    setKtp(emptyKtp);
    setOcrMessage("");
    if (!file.type.startsWith("image/")) {
      setOcrMessage("Untuk KTP, pilih foto atau gambar. PDF tidak dapat dibaca otomatis.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setOcrMessage("Ukuran foto maksimal 10MB. Pilih foto yang lebih kecil.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setOcrBusy(true);
    setOcrMessage("Membaca foto KTP...");
    let timedOut = false;
    const workerControl: { terminate: (() => Promise<unknown>) | null } = { terminate: null };
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          const terminate = workerControl.terminate;
          workerControl.terminate = null;
          if (terminate) void terminate();
          reject(new Error("KTP_OCR_TIMEOUT"));
        }, 10_000);
      });
      const recognition = (async () => {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("ind", undefined, {
          workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js",
          corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0",
          langPath: "/tessdata",
          gzip: true,
          logger: (message) => {
            if (!timedOut && message.status === "recognizing text") {
              setOcrMessage(`Membaca foto KTP... ${Math.round((message.progress ?? 0) * 100)}%`);
            }
          },
        });
        workerControl.terminate = () => worker.terminate();
        if (timedOut) {
          await worker.terminate();
          throw new Error("KTP_OCR_TIMEOUT");
        }
        return worker.recognize(file);
      })();
      const { data } = await Promise.race([recognition, timeout]);
      const fields = parseKtpText(data.text);
      setKtp(fields);
      setOcrMessage(fields.nik || fields.name || fields.address
        ? "Hasil pembacaan terisi. Periksa dan koreksi data sebelum dikirim."
        : "KTP Anda tidak terbaca. Pastikan foto jelas dan seluruh KTP masuk ke dalam panduan, lalu coba lagi.");
    } catch (error) {
      if (error instanceof Error && error.message === "KTP_OCR_TIMEOUT") {
        setOcrMessage("KTP Anda tidak terbaca dalam 10 detik. Pastikan foto jelas dan seluruh KTP masuk ke dalam panduan, lalu coba lagi.");
      } else {
        setOcrMessage("Pembacaan otomatis gagal. Silakan isi NIK, nama, dan alamat secara manual.");
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (workerControl.terminate) await workerControl.terminate();
      setOcrBusy(false);
    }
  }

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Kamera tidak tersedia di browser ini. Pilih foto KTP dari perangkat.");
      return;
    }
    setCameraLoading(true);
    try {
      cameraStream.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      setCameraOpen(true);
    } catch {
      setCameraError("Tidak dapat membuka kamera. Izinkan akses kamera atau pilih foto dari perangkat.");
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    cameraStream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  async function captureKtp() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }
    const targetAspect = 1.586;
    let cropWidth = video.videoWidth;
    let cropHeight = video.videoHeight;
    let cropX = 0;
    let cropY = 0;
    if (video.videoWidth / video.videoHeight > targetAspect) {
      cropWidth = video.videoHeight * targetAspect;
      cropX = (video.videoWidth - cropWidth) / 2;
    } else {
      cropHeight = video.videoWidth / targetAspect;
      cropY = (video.videoHeight - cropHeight) / 2;
    }
    // Match the inset white card frame and retain the KTP's landscape proportions.
    cropX += cropWidth * 0.04;
    cropY += cropHeight * 0.04;
    cropWidth *= 0.92;
    cropHeight *= 0.92;
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = Math.round(canvas.width / targetAspect);
    canvas.getContext("2d")?.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      setCameraError("Foto gagal diambil. Silakan coba lagi.");
      return;
    }
    const file = new File([blob], `ktp-${Date.now()}.jpg`, { type: "image/jpeg" });
    if (fileInput.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.current.files = transfer.files;
    }
    stopCamera();
    void readKtp(file);
  }

  function handleCategoryChange(value: string) {
    stopCamera();
    setCategory(value);
    setKtp(emptyKtp);
    setOcrMessage("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;
    formData.delete("file");
    formData.set("title", file?.name ?? "Dokumen");

    if (!file || file.size === 0) {
      setState({ error: "Pilih file terlebih dahulu.", success: false });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setState({ error: "Ukuran file maksimal 10MB.", success: false });
      return;
    }
    if (category.toUpperCase() === "KTP" && (!/^\d{16}$/.test(ktp.nik) || !ktp.name.trim() || !ktp.address.trim())) {
      setState({ error: "Pastikan NIK 16 digit, nama, dan alamat sudah benar.", success: false });
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      setState({ error: "Sesi berakhir, silakan masuk kembali.", success: false });
      return;
    }
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    setUploading(false);

    if (uploadError) {
      setState({ error: "Gagal mengunggah file. Coba lagi.", success: false });
      return;
    }
    formData.set("file_path", path);

    startTransition(async () => {
      const result = await createDocument(initialState, formData);
      setState(result);
      if (result.success) {
        form.reset();
        setCategory("");
        setKtp(emptyKtp);
        setOcrMessage("");
        closeForm();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Unggah Dokumen</h2>
        <button type="button" onClick={closeForm} disabled={busy} className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">Tutup</button>
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Jenis Dokumen</label>
        <select id="category" name="category" required value={category} onChange={(event) => handleCategoryChange(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="" disabled>Pilih jenis dokumen</option>
          {documentTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">{category.toUpperCase() === "KTP" ? "Foto KTP" : "File"}</label>
        {category.toUpperCase() === "KTP" && <div className="mt-2 space-y-2">
          {cameraOpen ? <div className="space-y-2">
            <p className="text-xs text-gray-600">Posisikan KTP mendatar di dalam bingkai. Pastikan NIK, nama, dan alamat berada di kotak putih.</p>
            <div className="relative aspect-[1.586] w-full overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-[4%] rounded-md border-2 border-white/90" />
              <div className="pointer-events-none absolute left-[31%] top-[20%] flex h-[15%] w-[57%] items-start rounded border-2 border-white bg-black/10 px-1 pt-0.5 text-[10px] font-semibold text-white drop-shadow sm:text-xs">NIK</div>
              <div className="pointer-events-none absolute left-[18%] top-[38%] flex h-[13%] w-[70%] items-start rounded border-2 border-white bg-black/10 px-1 pt-0.5 text-[10px] font-semibold text-white drop-shadow sm:text-xs">NAMA</div>
              <div className="pointer-events-none absolute left-[18%] top-[57%] flex h-[24%] w-[70%] items-start rounded border-2 border-white bg-black/10 px-1 pt-0.5 text-[10px] font-semibold text-white drop-shadow sm:text-xs">ALAMAT</div>
            </div>
            <button type="button" onClick={() => void captureKtp()} disabled={ocrBusy} className="w-full rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Ambil Foto KTP</button>
            <button type="button" onClick={stopCamera} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">Tutup Kamera</button>
          </div> : <button type="button" onClick={() => void startCamera()} disabled={busy} className="w-full rounded-md border border-brand-navy px-3 py-2 text-sm font-medium text-brand-navy disabled:opacity-50">{cameraLoading ? "Membuka kamera..." : "Buka Kamera"}</button>}
          {cameraError && <p className="text-xs text-red-600" role="alert">{cameraError}</p>}
          <p className="text-center text-xs text-gray-500">atau pilih foto dari perangkat</p>
        </div>}
        <input
          ref={fileInput}
          id="file"
          name="file"
          type="file"
          required
          disabled={busy}
          accept={category.toUpperCase() === "KTP" ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (category.toUpperCase() === "KTP" && file) {
              stopCamera();
              void readKtp(file);
            }
          }}
          className="mt-1 w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">{category.toUpperCase() === "KTP" ? "Gunakan foto yang jelas dan tidak terpotong. Data dibaca di perangkat ini." : "PDF/JPG/PNG/DOC, maks 10MB."}</p>
      </div>

      {category.toUpperCase() === "KTP" && <div className="space-y-3 rounded-lg bg-gray-50 p-3">
        {ocrMessage && <p className="text-xs text-gray-600" aria-live="polite">{ocrMessage}</p>}
        <div>
          <label htmlFor="extracted_nik" className="block text-sm font-medium text-gray-700">NIK</label>
          <input id="extracted_nik" name="extracted_nik" value={ktp.nik} onChange={(event) => setKtp({ ...ktp, nik: event.target.value.replace(/\D/g, "").slice(0, 16) })} disabled={ocrBusy} inputMode="numeric" pattern="\d{16}" maxLength={16} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
        </div>
        <div>
          <label htmlFor="extracted_name" className="block text-sm font-medium text-gray-700">Nama</label>
          <input id="extracted_name" name="extracted_name" value={ktp.name} onChange={(event) => setKtp({ ...ktp, name: event.target.value })} disabled={ocrBusy} required maxLength={150} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
        </div>
        <div>
          <label htmlFor="extracted_address" className="block text-sm font-medium text-gray-700">Alamat</label>
          <textarea id="extracted_address" name="extracted_address" value={ktp.address} onChange={(event) => setKtp({ ...ktp, address: event.target.value })} disabled={ocrBusy} required maxLength={500} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
        </div>
      </div>}

      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        {ocrBusy ? "Membaca KTP..." : uploading ? "Mengunggah..." : isPending ? "Menyimpan..." : "Kirim untuk Approval"}
      </button>
    </form>
  );
}
