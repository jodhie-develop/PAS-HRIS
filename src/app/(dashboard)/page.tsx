import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { signOut } from "./actions";
import {
  IconBanknote,
  IconBriefcase,
  IconCalendarOff,
  IconChart,
  IconClock,
  IconFileText,
  IconHistory,
  IconLogout,
  IconMegaphone,
  IconUsersCheck,
} from "@/components/icons";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const role = profile?.role ?? "employee";

  const menuItems = [
    { href: "/absensi", label: "Kehadiran", icon: IconClock, show: true },
    { href: "/leave", label: "Off", icon: IconCalendarOff, show: true },
    { href: "/attendance-history", label: "Cat Kehadiran", icon: IconHistory, show: true },
    { href: "/approvals", label: "Supervisor", icon: IconUsersCheck, show: role !== "employee" },
    { href: "/announcements", label: "Memo", icon: IconMegaphone, show: true },
    { href: "/payslips", label: "Slip Gaji", icon: IconBanknote, show: role !== "supervisor" },
    { href: "/assets", label: "Asset", icon: IconBriefcase, show: true },
    { href: "/documents", label: "Dokumen", icon: IconFileText, show: true },
    { href: "#", label: "KPI", icon: IconChart, show: true, disabled: true },
  ].filter((item) => item.show);

  return (
    <div>
      <div className="bg-brand-red px-4 pt-4 pb-8 text-white">
        <div className="flex items-center justify-between">
          <Image src="/logo.png" alt="PRS" width={36} height={36} className="drop-shadow" />
          <form action={signOut}>
            <button type="submit" aria-label="Keluar" className="text-white/90 hover:text-white">
              <IconLogout className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL, not a domain we can whitelist ahead of time
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="h-18 w-18 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <div className="flex h-18 w-18 items-center justify-center rounded-full border-2 border-white bg-white/10 text-xl font-semibold">
              {initials(profile?.full_name ?? user!.email ?? "?")}
            </div>
          )}
          <p className="mt-2 text-lg font-semibold">{profile?.full_name ?? user!.email}</p>
          <p className="text-sm text-white/85">
            {profile?.job_title ?? (role === "hr_admin" ? "HR Admin" : role === "supervisor" ? "Supervisor" : "Karyawan")}
          </p>
          {profile?.nik && <p className="text-xs text-white/70">NIK : {profile.nik}</p>}
        </div>
      </div>

      <div className="-mt-4 px-4">
        <Link
          href="/announcements"
          className="flex items-center justify-center gap-2 rounded-full border border-brand-red bg-white px-4 py-2.5 text-sm font-semibold text-brand-red shadow-sm"
        >
          <IconMegaphone className="h-4 w-4" />
          Pengumuman Perusahaan
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 px-6 py-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-red shadow-sm">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </>
          );

          if (item.disabled) {
            return (
              <div key={item.label} className="flex flex-col items-center gap-1.5 opacity-40">
                {content}
              </div>
            );
          }

          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1.5">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
