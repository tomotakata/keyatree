import { RecordStatus } from "@/lib/goalNavigatorStore";

const statusMap: Record<RecordStatus, { label: string; className: string }> = {
  draft: {
    label: "下書き",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  submitted: {
    label: "承認待ち",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  approved: {
    label: "承認済み",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

export default function RecordStatusBadge({ status }: { status: RecordStatus }) {
  const config = statusMap[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}