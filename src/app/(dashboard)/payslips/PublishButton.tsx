"use client";

import { useTransition } from "react";
import { publishPayslip } from "./actions";

export function PublishButton({ payslipId }: { payslipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => { await publishPayslip(payslipId); })}
      className="rounded-md bg-brand-red px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
    >
      {isPending ? "Memproses..." : "Publikasikan"}
    </button>
  );
}
