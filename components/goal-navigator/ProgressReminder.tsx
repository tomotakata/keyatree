"use client";

import { useEffect, useState, useRef } from "react";

type ProgressLog = {
  loggedAt: string;
  progress: string;
  challenge: string;
};

type ReminderRecord = {
  storageKey: string;
  recordId: string;
  kind: "quantitative" | "qualitative";
  title: string;
  name: string;
  department: string;
  deadline?: string;
  kr1?: string;
  kr2?: string;
  kr3?: string;
  approvedAt?: string;
  logs: ProgressLog[];
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

function reminderMessage(record: ReminderRecord): string {
  const logs = record.logs;
  const sinceApproval = daysSince(record.approvedAt);

  if (logs.length === 0) {
    if (sinceApproval >= 7) {
      return `「${record.title}」の承認から${sinceApproval}日が経過しています。最初の進捗を記録しましょう！`;
    }
    return `「${record.title}」が承認されました。目標に向けて、進捗を記録していきましょう。`;
  }

  const lastLog = logs[logs.length - 1];
  const daysSinceLast = daysSince(lastLog.loggedAt);

  if (daysSinceLast >= 14) {
    return `前回の進捗記録から${daysSinceLast}日が経過しています。「${record.title}」の現状を確認しましょう。`;
  }
  if (daysSinceLast >= 7) {
    return `先週の進捗はいかがでしたか？「${record.title}」の最新状況を入力してください。`;
  }
  return `「${record.title}」の進捗を継続して記録できています。この調子で続けましょう！`;
}

function urgencyLevel(record: ReminderRecord): "high" | "medium" | "low" {
  const sinceApproval = daysSince(record.approvedAt);
  if (record.logs.length === 0 && sinceApproval >= 7) return "high";
  if (record.logs.length > 0) {
    const daysSinceLast = daysSince(record.logs[record.logs.length - 1].loggedAt);
    if (daysSinceLast >= 14) return "high";
    if (daysSinceLast >= 7) return "medium";
  }
  return "low";
}

function ProgressCard({ record, onUpdate }: { record: ReminderRecord; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [progress, setProgress] = useState("");
  const [challenge, setChallenge] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const urgency = urgencyLevel(record);
  const message = reminderMessage(record);

  const urgencyStyles = {
    high: { bar: "bg-red-400", badge: "bg-red-100 text-red-700 border-red-200", icon: "!" },
    medium: { bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "?" },
    low: { bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "ok" },
  };
  const style = urgencyStyles[urgency];

  function handleSave() {
    if (!progress.trim()) return;
    setSaving(true);

    const newLog: ProgressLog = {
      loggedAt: new Date().toISOString(),
      progress: progress.trim(),
      challenge: challenge.trim(),
    };

    const logsKey = `keyatree_progress_logs_${record.recordId}`;
    const existing: ProgressLog[] = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(logsKey) || "[]");
      } catch {
        return [];
      }
    })();

    existing.push(newLog);
    window.localStorage.setItem(logsKey, JSON.stringify(existing));

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setProgress("");
      setChallenge("");
      setOpen(false);
      onUpdate();
      setTimeout(() => setSaved(false), 3000);
    }, 400);
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* urgency bar */}
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

            {record.deadline && (
              <p className="text-xs text-gray-400">期限: {record.deadline} / 承認日: {formatDate(record.approvedAt)}</p>
            )}

            {/* KR list */}
            {(record.kr1 || record.kr2 || record.kr3) && (
              <ul className="mt-2 space-y-0.5">
                {[record.kr1, record.kr2, record.kr3].filter(Boolean).map((kr, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {kr}
                  </li>
                ))}
              </ul>
            )}

            {/* latest log */}
            {record.logs.length > 0 && (
              <div className="mt-2 rounded-xl bg-gray-50 border p-3">
                <p className="text-xs text-gray-400 mb-1">最終記録: {formatDateTime(record.logs[record.logs.length - 1].loggedAt)}</p>
                <p className="text-sm text-gray-700">{record.logs[record.logs.length - 1].progress}</p>
                {record.logs[record.logs.length - 1].challenge && (
                  <p className="text-xs text-gray-500 mt-1">課題: {record.logs[record.logs.length - 1].challenge}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {record.logs.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                履歴 ({record.logs.length}件)
              </button>
            )}
            <button
              onClick={() => { setOpen((v) => !v); setTimeout(() => textareaRef.current?.focus(), 100); }}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition"
            >
              {open ? "閉じる" : "進捗を入力"}
            </button>
          </div>
        </div>

        {/* history panel */}
        {showHistory && record.logs.length > 0 && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <p className="text-xs font-bold text-gray-500">進捗履歴</p>
            {[...record.logs].reverse().map((log, i) => (
              <div key={i} className="rounded-xl bg-gray-50 border p-3 space-y-1">
                <p className="text-xs text-gray-400">{formatDateTime(log.loggedAt)}</p>
                <p className="text-sm text-gray-700">{log.progress}</p>
                {log.challenge && (
                  <p className="text-xs text-gray-500">課題: {log.challenge}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* input form */}
        {open && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">現在の進捗状況 <span className="text-red-400">*</span></label>
              <textarea
                ref={textareaRef}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                rows={3}
                placeholder="例：紹介案件比率が22%に改善。引き続き既存顧客へのフォロー連絡を継続中。"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">現在の課題・困っていること（任意）</label>
              <textarea
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                rows={2}
                placeholder="例：月初の商談数がまだ不足気味で、月末に負荷が集中しやすい。"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">記録はこの端末に保存されます</p>
              <div className="flex gap-2 items-center">
                {saved && <span className="text-xs font-bold text-emerald-600">保存しました</span>}
                <button
                  onClick={handleSave}
                  disabled={!progress.trim() || saving}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 px-5 py-2 text-sm font-bold text-white transition"
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgressReminder() {
  const [records, setRecords] = useState<ReminderRecord[]>([]);

  function load() {
    const sources = [
      { key: "keyatree_goal_navigator_draft", kind: "quantitative" as const },
      { key: "keyatree_qualitative_goal_navigator_draft", kind: "qualitative" as const },
    ];

    const next: ReminderRecord[] = [];

    for (const source of sources) {
      const raw = window.localStorage.getItem(source.key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as {
          recordId?: string;
          status?: string;
          approvedAt?: string;
          answers?: Record<string, string>;
        };
        if (parsed.status !== "approved" || !parsed.answers) continue;

        const recordId = parsed.recordId || `${source.kind}-local`;
        const logsKey = `keyatree_progress_logs_${recordId}`;
        const logs: ProgressLog[] = (() => {
          try { return JSON.parse(window.localStorage.getItem(logsKey) || "[]"); } catch { return []; }
        })();

        const a = parsed.answers;
        next.push({
          storageKey: source.key,
          recordId,
          kind: source.kind,
          title: a.goal || (source.kind === "quantitative" ? "目標設定シート" : "定性目標設定シート"),
          name: a.name || "",
          department: a.department || "",
          deadline: a.deadline,
          kr1: a.kr1,
          kr2: a.kr2,
          kr3: a.kr3,
          approvedAt: parsed.approvedAt,
          logs,
        });
      } catch {}
    }

    setRecords(next);
  }

  useEffect(() => { load(); }, []);

  if (records.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-800">承認済み目標 - 進捗リマインド</h2>
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          {records.length}件
        </span>
      </div>
      <p className="text-xs text-gray-500">承認済みの目標に対して、定期的に進捗・課題を記録することで振り返りができます。</p>
      {records.map((record) => (
        <ProgressCard key={record.recordId} record={record} onUpdate={load} />
      ))}
    </div>
  );
}
