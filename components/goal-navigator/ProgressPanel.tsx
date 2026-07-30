"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProgressReplyAction, addProgressUpdateAction } from "@/lib/goalNavigatorActions";
import type { ProgressUpdate } from "@/lib/goalNavigatorStore";

type Props = {
  recordId: string;
  updates: ProgressUpdate[];
  canWrite: boolean;
  canReply: boolean;
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function ReplyThread({
  recordId,
  update,
  canReply,
}: {
  recordId: string;
  update: ProgressUpdate;
  canReply: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const replies = [...(update.replies ?? [])].sort((a, b) => a.at.localeCompare(b.at));

  const submit = () => {
    setError("");
    if (!body.trim()) {
      setError("コメントを入力してください");
      return;
    }
    startTransition(async () => {
      const res = await addProgressReplyAction(recordId, update.id, body.trim());
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setBody("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      {replies.map((r) => (
        <div
          key={r.id}
          className={`rounded-lg px-3 py-2 text-sm ${
            r.isApprover ? "bg-amber-50 border border-amber-100" : "bg-gray-50 border border-gray-100"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">
              {r.authorName}
              {r.isApprover ? (
                <span className="ml-1 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  管理者
                </span>
              ) : null}
            </span>
            <span className="text-xs text-gray-400">{formatDate(r.at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap leading-6 text-gray-700">{r.body}</p>
        </div>
      ))}

      {canReply ? (
        open ? (
          <div className="space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="コメントを入力..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={pending}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
              >
                {pending ? "送信中..." : "コメントを送信"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setBody("");
                  setError("");
                }}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="text-xs font-bold text-amber-600 transition hover:text-amber-700"
          >
            + コメントを返信する
          </button>
        )
      ) : null}
    </div>
  );
}

export default function ProgressPanel({ recordId, updates, canWrite, canReply }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [percent, setPercent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const sorted = [...updates].sort((a, b) => b.at.localeCompare(a.at));

  const submit = () => {
    setError("");
    if (!body.trim()) {
      setError("進捗の内容を入力してください");
      return;
    }
    const pct = percent.trim() === "" ? undefined : Number(percent);
    startTransition(async () => {
      const res = await addProgressUpdateAction(recordId, body.trim(), pct);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setBody("");
      setPercent("");
      setNotice("進捗を記録しました");
      router.refresh();
      window.setTimeout(() => setNotice(""), 2500);
    });
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-800">進捗報告・コメント</h2>
      <p className="mt-1 text-sm text-gray-500">
        本人が進捗・達成度を記録し、管理者がコメントで返信できます。本人と承認者が確認できます。
      </p>

      {notice ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {canWrite ? (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="例：新規顧客への提案を3件実施。うち1件が受注確度高。"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">達成度</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="0-100"
                className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "記録中..." : "進捗を記録する"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
            進捗報告はまだありません
          </p>
        ) : (
          sorted.map((u) => (
            <div key={u.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-700">{u.authorName}</p>
                <div className="flex items-center gap-2">
                  {typeof u.percent === "number" ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      達成度 {u.percent}%
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-400">{formatDate(u.at)}</span>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{u.body}</p>
              <ReplyThread recordId={recordId} update={u} canReply={canReply} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
