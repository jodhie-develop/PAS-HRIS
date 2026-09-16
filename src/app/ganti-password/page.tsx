"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { changePassword, type ChangePasswordState } from "./actions";
import { signOut } from "@/lib/auth-actions";
import { IconEye, IconEyeOff, IconLock } from "@/components/icons";

const initialState: ChangePasswordState = { error: null };

export default function GantiPasswordPage() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
        <Image src="/logo.png" alt="PRS" width={120} height={120} className="drop-shadow-sm" />
        <h1 className="mt-2 text-xl font-semibold text-brand-red">Ganti Password</h1>
        <p className="mt-1 text-sm text-gray-600">Login pertama kali — buat password baru Anda.</p>
      </div>

      <div className="-mt-6 flex-1 rounded-t-3xl bg-background px-6 pt-8 pb-10">
        <div className="mx-auto w-full max-w-sm">
          <p className="text-sm text-gray-500">
            Demi keamanan, Anda wajib mengganti password sementara sebelum melanjutkan.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password Baru
              </label>
              <div className="relative mt-1">
                <IconLock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm shadow-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Minimal 8 karakter.</p>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Konfirmasi Password Baru
              </label>
              <div className="relative mt-1">
                <IconLock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-10 text-sm shadow-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>
            </div>

            {state.error && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-brand-red px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition active:bg-brand-red-dark disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>

          <form action={signOut} className="mt-4 text-center">
            <button type="submit" className="text-sm text-gray-500 hover:text-brand-red">
              Keluar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
