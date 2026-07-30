"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProgressReply = {
  id: string;
  at: string;
  authorName: string;
  isApprover?: boolean;
  body: string;
};

type ProgressUpdate = {
  id: string;
  at: string;
  authorName: string;
  body: string;
  replies?: ProgressReply[];
};

type NavigatorRecord = {
  id: string;
  kind: "quantitative" | "qualitative";
  title: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  answers: Record<string, string>;
  approvedAt?: string;
  progressUpdates?: ProgressUpdate[];
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function daysSince(iso?: string): number {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function reminderMessage(record: NavigatorRecord): string {
  const logs = record.progressUpdates ?? [];
  const sinceApproval = daysSince(record.approvedAt);
  if (logs.length === 0) {
    if (sinceApproval >= 7) {
      return `「${record.title}」の承認から${sinceApproval}日が経過しています。最初の進捗を記録しましょう！`;
    }
    return `「${record.title}」が承認されました。目標に向けて、進捗を記録していきましょう。`;
  }
  const last = logs[logs.length - 1];
  const daysSinceLast = daysSince(last.at);
  if (daysSinceLast >= 14) {
    return `前回の進捗記録から${daysSinceLast}日が経過しています。「${record.title}」の現状を確認しましょう。`;
  }
  if (daysSinceLast >= 7) {
    return `先週の進捗はいかがでしたか？「${record.title}」の最新状況を入力してください。`;
  }
  return `「${record.title}」の進捗を継続して記録できています。この調子で続けましょう！`;
}

function urgencyLevel(record: NavigatorRecord): "high" | "medium" | "low" {
  const logs = record.progressUpdates ?? [];
  const sinceApproval = daysSince(record.approvedAt);
  if (logs.length === 0 && sinceApproval >= 7) return "high";
  if (logs.length > 0) {
    const daysSinceLast = daysSince(logs[logs.length - 1].at);
    if (daysSinceLast >= 14) return "high";
    if (daysSinceLast >= 7) return "medium";
  }
  return "low";
}

function ProgressCard({ record }: { record: NavigatorRecord }) {
  const [showHistory, setShowHistory] = useState(false);
  const logs = record.progressUpdates ?? [];
  const a = record.answers || {};
  const krs = [a.kr1, a.kr2, a.kr3].filter(Boolean) as string[];

  const urgency = urgencyLevel(record);
  const message = reminderMessage(record);

  const urgencyStyles = {
    high: { bar: "bg-red-400", badge: "bg-red-100 text-red-700 border-red-200" },
    medium: { bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };
  const style = urgencyStyles[urgency];

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${style.bar}`} />
      <div className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>
                {urgency === "high" ? "要確認" : urgency === "medium" ? "確認推奨" : "良好"}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${record.kind === "quantitative" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
                {record.kind === "quantitative" ? "目標設定" : "定性目標"}
              </span>
            </div>
            <p className="text-base font-bold text-gray-800">{record.title}</p>
            <p className="text-sm text-gray-500">{message}</p>

            {a.deadline && (
              <p className="text-xs text-gray-400">期限: {a.deadline} / 承認日: {formatDate(record.approvedAt)}</p>
            )}

            {krs.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {krs.map((kr, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {kr}
                  </li>
                ))}
              </ul>
            )}

            {logs.length > 0 && (
              <div className="mt-2 rounded-xl bg-gray-50 border p-3">
                <p className="text-xs text-gray-400 mb-1">最終記録: {formatDateTime(logs[logs.length - 1].at)}</p>
                <p className="text-sm text-gray-700">{logs[logs.length - 1].body}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {logs.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                履歴 ({logs.length}件)
              </button>
            )}
            <Link
              href={`/approvals/goal-navigators/${record.id}`}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition"
            >
              進捗を入力
            </Link>
          </div>
        </div>

        {showHistory && logs.length > 0 && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <p className="text-xs font-bold text-gray-500">進捗履歴</p>
            {[...logs].reverse().map((log) => (
              <div key={log.id} className="rounded-xl bg-gray-50 border p-3 space-y-1">
                <p className="text-xs text-gray-400">{formatDateTime(log.at)} ・ {log.authorName}</p>
                <p className="text-sm text-gray-700">{log.body}</p>
                {(log.replies ?? []).map((rep) => (
                  <div key={rep.id} className={`mt-2 rounded-lg border p-2 ${rep.isApprover ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(rep.at)} ・ {rep.authorName}
                      {rep.isApprover ? <span className="ml-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">管理者</span> : null}
                    </p>
                    <p className="text-sm text-gray-700">{rep.body}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgressReminder({ employeeId }: { employeeId: string }) {
  const [records, setRecords] = useState<NavigatorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/goal-navigators?employeeId=${encodeURIComponent(employeeId)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { records: [] }))
      .then((data: { records?: NavigatorRecord[] }) => {
        if (!active) return;
        const approved = (data.records ?? []).filter((r) => r.status === "approved");
        setRecords(approved);
      })
      .catch(() => {
        if (active) setRecords([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        承認済み目標を読み込み中...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">承認済みの目標はまだありません。</p>
        <p className="text-xs text-gray-400 mt-1">目標設定を作成し、承認されるとここに表示されます。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-800">承認済み目標 - 進捗リマインド</h2>
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          {records.length}件
        </span>
      </div>
      <p className="text-xs text-gray-500">承認済みの目標に対して、定期的に進捗・課題を記録することで振り返りができます。記録はどの端末からでも確認できます。</p>
      {records.map((record) => (
        <ProgressCard key={record.id} record={record} />
      ))}
    </div>
  );
}
