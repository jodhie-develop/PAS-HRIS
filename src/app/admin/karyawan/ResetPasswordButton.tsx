"use client";

import { useState, useTransition } from "react";
import { resetEmployeePassword } from "./actions";

export function ResetPasswordButton({ employeeId }: { employeeId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetEmployeePassword(employeeId);
      if (result.error) {
        setError(result.error);
      } else {
        setTemporaryPassword(result.temporaryPassword ?? null);
        setConfirming(false);
      }
    });
  }

  if (temporaryPassword) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-800">Password berhasil direset</p>
        <p className="mt-1 text-sm text-emerald-800">
          Catat password sementara ini sekarang — tidak akan ditampilkan lagi. Sampaikan ke karyawan untuk
          login (akan diminta ganti password saat login pertama kali).
        </p>
        <div className="mt-2 rounded-lg border border-emerald-300 bg-white px-4 py-3 font-mono text-lg font-semibold text-emerald-900">
          {temporaryPassword}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">Lupa Password?</p>
          <p className="text-xs text-amber-700">
            Buat password sementara baru untuk karyawan ini. Mereka wajib menggantinya saat login berikutnya.
          </p>
        </div>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            Reset Password
          </button>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleReset}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Mereset..." : "Ya, Reset"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700"
            >
              Batal
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
