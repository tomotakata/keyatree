import HeaderNav from "@/components/HeaderNav";
import ClientApprovedList from "@/components/goal-navigator/ClientApprovedList";
import RecordActions from "@/components/goal-navigator/RecordActions";
import RecordStatusBadge from "@/components/goal-navigator/RecordStatusBadge";
import { getApprovedNavigatorRecords } from "@/lib/goalNavigatorActions";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default async function ApprovedGoalNavigatorPage() {
  const records = await getApprovedNavigatorRecords();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav currentLabel="承認済み一覧" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-gray-800">目標設定・定性目標 承認済み一覧</h1>
          <p className="mt-1 text-sm text-gray-500">承認済みの目標設定と定性目標を確認できます。</p>
        </div>

        <div className="space-y-4">
          <ClientApprovedList />
          {records.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              承認済みのレコードはまだありません
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-gray-800">{record.title}</p>
                      <RecordStatusBadge status={record.status} />
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${record.kind === "quantitative" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
                        {record.kind === "quantitative" ? "目標設定" : "定性目標"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{record.employeeName} / {record.department}</p>
                    <p className="text-xs text-gray-400">承認日 {formatDate(record.approvedAt || record.updatedAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right text-xs text-gray-400">
                      <p>承認者</p>
                      <p className="mt-1 text-sm font-medium text-gray-600">{record.approvedBy || "-"}</p>
                    </div>
                    <RecordActions record={record} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}