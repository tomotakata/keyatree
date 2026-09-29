import Link from "next/link";
import ClientDraftHistory from "@/components/goal-navigator/ClientDraftHistory";
import HistoryEmptyState from "@/components/goal-navigator/HistoryEmptyState";
import RecordStatusBadge from "@/components/goal-navigator/RecordStatusBadge";
import { getMyNavigatorRecords } from "@/lib/goalNavigatorActions";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default async function MyGoalsPage() {
  const records = await getMyNavigatorRecords();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">過去の目標設定履歴</h1>
            <p className="mt-1 text-sm text-gray-500">本人が保存・提出した定量・定性の目標設定を確認できます。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/goal-navigator"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              定量を作成
            </Link>
            <Link
              href="/qualitative-goal-navigator"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              定性を作成
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <ClientDraftHistory
            storageKey="keyatree_goal_navigator_draft"
            href="/goal-navigator"
            emptyLabel="定量目標設定の下書き"
          />
          <ClientDraftHistory
            storageKey="keyatree_qualitative_goal_navigator_draft"
            href="/qualitative-goal-navigator"
            emptyLabel="定性目標設定の下書き"
          />
          {records.length === 0 ? (
            <HistoryEmptyState
              title="サーバー保存の履歴はまだありません"
              href="/goal-navigator"
              buttonLabel="新しく作成"
            />
          ) : (
            records.map((record) => {
              const isQuantitative = record.kind === "quantitative";
              return (
                <div key={record.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-gray-800">{record.title}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isQuantitative ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {isQuantitative ? "定量" : "定性"}
                        </span>
                        <RecordStatusBadge status={record.status} />
                      </div>
                      <p className="text-sm text-gray-500">{record.department}</p>
                      <p className="text-xs text-gray-400">更新日 {formatDate(record.updatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-sm text-gray-500">
                        {record.approvedAt
                          ? `承認日 ${formatDate(record.approvedAt)}`
                          : record.submittedAt
                          ? `提出日 ${formatDate(record.submittedAt)}`
                          : "下書き保存"}
                      </div>
                      <Link
                        href={`/approvals/goal-navigators/${record.id}`}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
                          isQuantitative ? "bg-emerald-500 hover:bg-emerald-600" : "bg-indigo-500 hover:bg-indigo-600"
                        }`}
                      >
                        詳細・進捗入力
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
