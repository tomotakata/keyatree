"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import QuantitativeSheet from "@/components/goal-navigator/QuantitativeSheet";
import QualitativeSheet from "@/components/goal-navigator/QualitativeSheet";
import { updateOwnNavigatorAnswersAction } from "@/lib/goalNavigatorActions";
import type { NavigatorKind } from "@/lib/goalNavigatorStore";

export default function OwnerSheetEditor({
  recordId,
  kind,
  initialAnswers,
  profile,
}: {
  recordId: string;
  kind: NavigatorKind;
  initialAnswers: Record<string, string>;
  profile: { name?: string; stage?: string; department?: string; grade?: string };
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [editing, setEditing] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const onChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await updateOwnNavigatorAnswersAction(recordId, answers);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setEditing(false);
      setNotice("入力内容を保存しました");
      window.setTimeout(() => setNotice(""), 2500);
    });
  };

  const cancel = () => {
    setAnswers(initialAnswers || {});
    setEditing(false);
    setError("");
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/my-goals"
            className="text-xs font-bold text-gray-500 hover:text-emerald-600 transition"
          >
            ← 履歴一覧に戻る
          </Link>
          <h2 className="text-base font-bold text-gray-800">目標設定シート</h2>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            編集する
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        提出済みの目標シートを編集できます。保存すると最新の内容が反映されます。
      </p>

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div className="mt-4">
        {kind === "quantitative" ? (
          <QuantitativeSheet
            answers={answers}
            onChange={onChange}
            disabled={!editing}
            profile={{ name: profile.name, stage: profile.stage, grade: profile.grade }}
          />
        ) : (
          <QualitativeSheet
            answers={answers}
            onChange={onChange}
            disabled={!editing}
            profile={{ name: profile.name, department: profile.department, grade: profile.grade }}
          />
        )}
      </div>
    </div>
  );
}
