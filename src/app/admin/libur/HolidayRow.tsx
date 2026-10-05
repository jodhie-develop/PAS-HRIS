"use client";

import { useState, useTransition } from "react";
import type { PublicHoliday } from "@/types/database";
import { deleteHoliday } from "./actions";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HolidayRow({ holiday }: { holiday: PublicHoliday }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const weekday = new Date(`${holiday.date}T00:00:00Z`).getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteHoliday(holiday.date);
      if (result.error) setError(result.error);
    });
  }

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-3 text-sm text-gray-900">
        {formatDate(holiday.date)}
        {isWeekend && <span className="ml-2 text-xs text-gray-400">(akhir pekan)</span>}
      </td>
      <td className="py-2 pr-3 text-sm text-gray-600">{holiday.name}</td>
      <td className="py-2 pr-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          {isPending ? "Menghapus..." : "Hapus"}
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
