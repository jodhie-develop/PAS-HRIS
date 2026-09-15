type Accent = "red" | "green" | "navy" | "amber";

const accentStyles: Record<Accent, string> = {
  red: "bg-brand-red/10 text-brand-red",
  green: "bg-emerald-100 text-emerald-700",
  navy: "bg-brand-navy/10 text-brand-navy",
  amber: "bg-amber-100 text-amber-700",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  suffix,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentStyles[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-gray-400">{suffix}</span>}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
