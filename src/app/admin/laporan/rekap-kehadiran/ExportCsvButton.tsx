"use client";

type AttendanceReportRow = {
  name: string;
  total: number;
  normal: number;
  late: number;
  early: number;
  leave: number;
  otherLeave: number;
};

const HEADERS = [
  "Nama",
  "Jumlah Kehadiran",
  "Hadir Normal",
  "Hadir Terlambat",
  "Pulang Mendahului",
  "Cuti",
  "Ijin Lainnya",
];

function escapeCsv(value: string | number) {
  const safeValue = typeof value === "string" && /^[=+@\-\t\r]/.test(value) ? `'${value}` : String(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function ExportCsvButton({ rows, startDate, endDate }: {
  rows: AttendanceReportRow[];
  startDate: string;
  endDate: string;
}) {
  function download() {
    const content = [
      HEADERS,
      ...rows.map((row) => [row.name, row.total, row.normal, row.late, row.early, row.leave, row.otherLeave]),
    ].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-absensi-${startDate}-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Export Excel
    </button>
  );
}
