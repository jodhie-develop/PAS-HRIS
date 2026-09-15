"use client";

import { useState, useTransition } from "react";
import type { WorkShift } from "@/types/database";
import { updateShift, deleteShift } from "./actions";

export function ShiftRow({ shift }: { shift: WorkShift }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(shift.shift_name);
  const [start, setStart] = useState(shift.start_time.slice(0, 5));
  const [end, setEnd] = useState(shift.end_time.slice(0, 5));

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateShift(shift.id, name, start, end);
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteShift(shift.id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-gray-100">
        <td className="py-2 pr-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2 pr-3">
          <input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2 pr-3">
          <input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2 pr-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="rounded-md bg-brand-red px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Simpan
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setEditing(false)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
            >
              Batal
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-3 text-sm text-gray-900">{shift.shift_name}</td>
      <td className="py-2 pr-3 text-sm text-gray-600">{shift.start_time.slice(0, 5)}</td>
      <td className="py-2 pr-3 text-sm text-gray-600">{shift.end_time.slice(0, 5)}</td>
      <td className="py-2 pr-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-brand-navy hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
