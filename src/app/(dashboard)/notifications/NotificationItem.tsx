"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppNotification, NotificationType } from "@/types/database";
import { IconCalendarOff, IconClockAlert } from "@/components/icons";
import { markNotificationRead } from "./actions";

const TYPE_STYLES: Record<NotificationType, { icon: typeof IconClockAlert; className: string }> = {
  late: { icon: IconClockAlert, className: "bg-amber-100 text-amber-700" },
  early_leave: { icon: IconClockAlert, className: "bg-amber-100 text-amber-700" },
  leave_request: { icon: IconCalendarOff, className: "bg-brand-navy/10 text-brand-navy" },
};

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationItem({ notification }: { notification: AppNotification }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unread = !notification.read_at;
  const { icon: Icon, className } = TYPE_STYLES[notification.type] ?? TYPE_STYLES.late;

  function handleClick() {
    startTransition(async () => {
      if (unread) await markNotificationRead(notification.id);
      if (notification.link) router.push(notification.link);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-150 disabled:opacity-60 ${
        unread ? "border-brand-red/20 bg-white" : "border-gray-200 bg-gray-50"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
          {notification.title}
        </span>
        {notification.body && <span className="mt-0.5 block text-xs text-gray-500">{notification.body}</span>}
        <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(notification.created_at)}</span>
      </span>
      {unread && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-red" aria-label="Belum dibaca" />}
    </button>
  );
}
