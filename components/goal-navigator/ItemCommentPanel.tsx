"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addItemCommentAction } from "@/lib/goalNavigatorActions";
import type { ItemComment } from "@/lib/goalNavigatorStore";

type Target = "company" | "team" | "personal";

type GoalItem = {
  target: Target;
  label: string;
  item?: string;
  deadline?: string;
  value?: string;
  progress?: string;
  result?: string;
};

type Props = {
  recordId: string;
  comments: ItemComment[];
  goals: GoalItem[];
  canApprove: boolean;
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function CommentBox({ recordId, target, canApprove }: { recordId: string; target: Target; canApprove: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  if (!canApprove) return null;

  const submit = () => {
    setError("");
    if (!body.trim()) {
      setError("コメントを入力してください");
      return;
    }
    startTransition(async () => {
      const res = await addItemCommentAction(recordId, target, body.trim());
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="この目標項目へのコメントを入力..."
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
      />
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
      <button
        onClick={submit}
        disabled={pending}
        className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
      >
        {pending ? "送信中..." : "コメントを送信"}
      </button>
    </div>
  );
}

export default function ItemCommentPanel({ recordId, comments, goals, canApprove }: Props) {
  const active = goals.filter((g) => g.item || g.value || g.deadline);
  if (active.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-800">目標項目へのコメント</h2>
      <p className="mt-1 text-sm text-gray-500">
        各目標項目に対して承認者がコメントできます。複数の承認者が複数件コメントできます。
      </p>

      <div className="mt-4 space-y-4">
        {active.map((g) => {
          const list = comments
            .filter((c) => c.target === g.target)
            .sort((a, b) => a.at.localeCompare(b.at));
          return (
            <div key={g.target} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold text-emerald-700">{g.label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-gray-800">
                {g.item || "（目標項目 未入力）"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                目標達成期日：{g.deadline || "-"} ／ 目標数値：{g.value || "-"}
                {(g.progress || g.result) ? (
                  <>
                    {" "}
                    ／ 進捗数値：{g.progress || "-"} ／ 結果数値：{g.result || "-"}
                  </>
                ) : null}
              </p>

              <div className="mt-3 space-y-2">
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400">まだコメントはありません</p>
                ) : (
                  list.map((c) => (
                    <div key={c.id} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-700">
                          {c.authorName}
                          <span className="ml-1 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            承認者
                          </span>
                        </span>
                        <span className="text-[11px] text-gray-400">{formatDate(c.at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{c.body}</p>
                    </div>
                  ))
                )}
              </div>

              <CommentBox recordId={recordId} target={g.target} canApprove={canApprove} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
