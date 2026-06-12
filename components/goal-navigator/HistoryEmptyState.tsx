import Link from "next/link";

export default function HistoryEmptyState({
  title,
  href,
  buttonLabel,
}: {
  title: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      <p className="text-sm text-gray-400">{title}</p>
      <div className="mt-4">
        <Link
          href={href}
          className="inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}