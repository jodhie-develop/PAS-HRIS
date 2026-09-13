import Link from "next/link";

export function PageHeader({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 bg-brand-red px-4 py-3 text-white">
      <Link href="/" aria-label="Kembali ke beranda" className="shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-sm font-semibold tracking-wide uppercase">{title}</h1>
    </div>
  );
}
