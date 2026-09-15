import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { IconLogout } from "@/components/icons";

export function AdminTopbar({ name }: { name: string }) {
  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="PRS" width={32} height={32} />
          <div>
            <p className="text-sm font-semibold text-gray-900">Dashboard Admin</p>
            <p className="text-xs text-gray-500">PT. Prasasti Adyadma Sentosa</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-gray-600 sm:inline">Halo, {name}</span>
          <Link
            href="/"
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Aplikasi Mobile
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Keluar"
              className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-red"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
