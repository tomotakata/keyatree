import HeaderNav from "@/components/HeaderNav";
import RecordStatusBadge from "@/components/goal-navigator/RecordStatusBadge";
import { getApprovalAccess, getApprovalNavigatorRecords } from "@/lib/goalNavigatorActions";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default async function GoalNavigatorApprovalPage() {
  const isApprover = await getApprovalAccess();

  if (!isApprover) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderNav currentLabel="目標設定承認" />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="text-base font-bold text-gray-700">アクセス権限がありません</p>
            <p className="mt-2 text-sm text-gray-500">
              承認申請一覧は管理者・人事管理者のアカウントのみ閲覧できます。
            </p>
            <Link
              href="/employees"
              className="mt-4 inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              ホームへ戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const records = await getApprovalNavigatorRecords();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav currentLabel="目標設定承認" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-gray-800">目標設定・定性目標 承認申請一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理者・人事管理者向けの承認待ち一覧です。各申請の「詳細を確認」から内容確認・承認・やり直し依頼・進捗確認ができます。
          </p>
          <div className="mt-4">
            <Link
              href="/approvals/goal-navigators/approved"
              className="inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              承認済み一覧を見る
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              承認待ちのレコードはありません
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
                    <p className="text-xs text-gray-400">提出日 {formatDate(record.submittedAt || record.updatedAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`/approvals/goal-navigators/${record.id}`}
                      className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      詳細を確認・決裁する
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