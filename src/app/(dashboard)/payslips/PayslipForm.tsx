"use client";

import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPayslip, type PayslipFormState } from "./actions";
import type { Profile } from "@/types/database";

const initialState: PayslipFormState = { error: null, success: false };

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatIDR(value: number) {
  if (Number.isNaN(value)) return "Rp 0";
  return value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

export function PayslipForm({ employees }: { employees: Profile[] }) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<PayslipFormState>(initialState);
  const [grossIncome, setGrossIncome] = useState("0");
  const [totalDeductions, setTotalDeductions] = useState("0");

  const takeHomePay = useMemo(() => {
    const gross = Number(grossIncome) || 0;
    const deductions = Number(totalDeductions) || 0;
    return gross - deductions;
  }, [grossIncome, totalDeductions]);

  const busy = uploading || isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const userId = formData.get("user_id");
    const file = formData.get("pdf") as File | null;
    formData.delete("pdf");

    if (file && file.size > 0) {
      setUploading(true);
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("payslips").upload(path, file);
      setUploading(false);

      if (uploadError) {
        setState({ error: "Gagal mengunggah PDF. Coba lagi.", success: false });
        return;
      }
      formData.set("file_path", path);
    }

    startTransition(async () => {
      const result = await createPayslip(initialState, formData);
      setState(result);
      if (result.success) {
        form.reset();
        setGrossIncome("0");
        setTotalDeductions("0");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
          Karyawan
        </label>
        <select
          id="user_id"
          name="user_id"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Pilih karyawan</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name} ({employee.nik})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="period_month" className="block text-sm font-medium text-gray-700">
            Bulan
          </label>
          <select
            id="period_month"
            name="period_month"
            required
            defaultValue={new Date().getMonth() + 1}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="period_year" className="block text-sm font-medium text-gray-700">
            Tahun
          </label>
          <input
            id="period_year"
            name="period_year"
            type="number"
            required
            defaultValue={new Date().getFullYear()}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="payslip_type" className="block text-sm font-medium text-gray-700">
          Jenis Slip
        </label>
        <input
          id="payslip_type"
          name="payslip_type"
          type="text"
          required
          placeholder="Gaji Bulanan / THR / Bonus"
          list="payslip-type-options"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <datalist id="payslip-type-options">
          <option value="Gaji Bulanan" />
          <option value="THR" />
          <option value="Bonus" />
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gross_income" className="block text-sm font-medium text-gray-700">
            Gaji Kotor
          </label>
          <input
            id="gross_income"
            name="gross_income"
            type="number"
            min="0"
            required
            value={grossIncome}
            onChange={(event) => setGrossIncome(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="total_deductions" className="block text-sm font-medium text-gray-700">
            Total Potongan
          </label>
          <input
            id="total_deductions"
            name="total_deductions"
            type="number"
            min="0"
            required
            value={totalDeductions}
            onChange={(event) => setTotalDeductions(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Take Home Pay: <span className="font-medium text-gray-900">{formatIDR(takeHomePay)}</span>
      </p>

      <div>
        <label htmlFor="pdf" className="block text-sm font-medium text-gray-700">
          File PDF (opsional)
        </label>
        <input
          id="pdf"
          name="pdf"
          type="file"
          accept="application/pdf"
          className="mt-1 w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Maks 5MB.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="is_draft" className="rounded border-gray-300" />
        Simpan sebagai draft (belum terlihat oleh karyawan)
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Slip gaji berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {uploading ? "Mengunggah PDF..." : isPending ? "Menyimpan..." : "Simpan Slip Gaji"}
      </button>
    </form>
  );
}
