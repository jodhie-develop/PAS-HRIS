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
  IconLayoutDashboard,
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
    { href: "/admin", label: "Dashboard", icon: IconLayoutDashboard, show: role === "hr_admin" },
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
      <div className="bg-brand-cream px-4 pt-4 pb-10">
        <div className="flex items-center justify-between">
          <Image src="/logo.png" alt="PRS" width={36} height={36} className="drop-shadow-sm" />
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Keluar"
              className="rounded-full p-1.5 text-gray-500 transition-colors duration-150 hover:bg-white hover:text-brand-red active:bg-white/70"
            >
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
              className="h-18 w-18 rounded-full border-2 border-brand-red object-cover"
            />
          ) : (
            <div className="flex h-18 w-18 items-center justify-center rounded-full border-2 border-brand-red bg-white text-xl font-semibold text-brand-red">
              {initials(profile?.full_name ?? user!.email ?? "?")}
            </div>
          )}
          <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.full_name ?? user!.email}</p>
          <p className="text-sm text-gray-600">
            {profile?.job_title ?? (role === "hr_admin" ? "HR Admin" : role === "supervisor" ? "Supervisor" : "Karyawan")}
          </p>
          {profile?.nik && <p className="text-xs text-gray-500">NIK : {profile.nik}</p>}
        </div>
      </div>

      <div className="bg-dot-pattern -mt-6 rounded-t-3xl bg-background px-4 pt-6 pb-10">
        <Link
          href="/announcements"
          className="flex items-center justify-center gap-2 rounded-full border border-brand-red bg-white px-4 py-2.5 text-sm font-semibold text-brand-red shadow-sm transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm"
        >
          <IconMegaphone className="h-4 w-4" />
          Pengumuman Perusahaan
        </Link>

        <div className="grid grid-cols-3 gap-4 px-2 py-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-brand-red shadow-sm transition-[transform,box-shadow,color] duration-200 ease-out will-change-transform group-hover:text-brand-red-dark group-hover:[transform:perspective(500px)_rotateX(14deg)_translateY(-6px)_scale(1.1)] group-hover:shadow-xl group-active:[transform:perspective(500px)_rotateX(4deg)_scale(0.92)] group-active:shadow-md">
                  <Icon className="h-9 w-9" />
                </span>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </>
            );

            if (item.disabled) {
              return (
                <div key={item.label} className="group flex flex-col items-center gap-1.5 opacity-40">
                  {content}
                </div>
              );
            }

            return (
              <Link key={item.label} href={item.href} className="group flex flex-col items-center gap-1.5">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
