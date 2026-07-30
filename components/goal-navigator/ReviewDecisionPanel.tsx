"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveNavigatorRecordAction, rejectNavigatorRecordAction } from "@/lib/goalNavigatorActions";
import type { RecordStatus } from "@/lib/goalNavigatorStore";

type Props = {
  recordId: string;
  status: RecordStatus;
};

export default function ReviewDecisionPanel({ recordId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const runApprove = () => {
    setError("");
    startTransition(async () => {
      const res = await approveNavigatorRecordAction(recordId, comment.trim() || undefined);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setNotice("承認しました");
      setComment("");
      setMode("idle");
      router.refresh();
    });
  };

  const runReject = () => {
    setError("");
    if (!comment.trim()) {
      setError("やり直し依頼の理由・修正指示を入力してください");
      return;
    }
    startTransition(async () => {
      const res = await rejectNavigatorRecordAction(recordId, comment.trim());
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setNotice("やり直し依頼を送信しました");
      setComment("");
      setMode("idle");
      router.refresh();
    });
  };

  const decided = status === "approved" || status === "rejected";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-800">承認の決裁</h2>
      <p className="mt-1 text-sm text-gray-500">
        内容を確認し、「承認」または「やり直し依頼（非承認）」を選択してください。
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

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-bold text-gray-500">
          コメント / 修正指示（やり直し依頼時は必須）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="例：数値目標の根拠をもう少し具体的にしてください。"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={runApprove}
            disabled={pending}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "処理中..." : "承認する"}
          </button>
          {mode === "reject" ? (
            <button
              onClick={runReject}
              disabled={pending}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "処理中..." : "やり直しを依頼する"}
            </button>
          ) : (
            <button
              onClick={() => setMode("reject")}
              disabled={pending}
              className="rounded-xl border border-rose-300 px-5 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              やり直し依頼（非承認）
            </button>
          )}
        </div>

        {decided ? (
          <p className="text-xs text-gray-400">
            現在のステータス：{status === "approved" ? "承認済み" : "やり直し依頼中"}。再度決裁することもできます。
          </p>
        ) : null}
      </div>
    </div>
  );
}
