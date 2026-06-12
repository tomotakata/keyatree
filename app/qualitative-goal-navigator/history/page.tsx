import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import ClientDraftHistory from "@/components/goal-navigator/ClientDraftHistory";
import HistoryEmptyState from "@/components/goal-navigator/HistoryEmptyState";
import RecordStatusBadge from "@/components/goal-navigator/RecordStatusBadge";
import { getMyNavigatorRecords } from "@/lib/goalNavigatorActions";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default async function QualitativeGoalNavigatorHistoryPage() {
  const records = await getMyNavigatorRecords("qualitative");

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav currentLabel="定性目標設定履歴" />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">定性目標設定ナビゲーター 保存履歴</h1>
            <p className="mt-1 text-sm text-gray-500">本人が保存・提出した定性目標の履歴を確認できます。</p>
          </div>
          <Link href="/qualitative-goal-navigator" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
            新しく作成
          </Link>
        </div>

        <div className="space-y-3">
          <ClientDraftHistory
            storageKey="keyatree_qualitative_goal_navigator_draft"
            href="/qualitative-goal-navigator"
            emptyLabel="定性目標設定の下書き"
          />
          {records.length === 0 ? (
            <HistoryEmptyState
              title="サーバー保存の履歴はまだありません"
              href="/qualitative-goal-navigator"
              buttonLabel="新しく作成"
            />
          ) : (
            records.map((record) => (
              <div key={record.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-gray-800">{record.title}</p>
                      <RecordStatusBadge status={record.status} />
                    </div>
                    <p className="text-sm text-gray-500">{record.department}</p>
                    <p className="text-xs text-gray-400">更新日 {formatDate(record.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                      {record.approvedAt ? `承認日 ${formatDate(record.approvedAt)}` : record.submittedAt ? `提出日 ${formatDate(record.submittedAt)}` : "下書き保存"}
                    </div>
                    <Link
                      href="/qualitative-goal-navigator"
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
                    >
                      開く
                    </Link>
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