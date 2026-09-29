"use client";

import { useState, useTransition } from "react";
import QuantitativeSheet from "@/components/goal-navigator/QuantitativeSheet";
import QualitativeSheet from "@/components/goal-navigator/QualitativeSheet";
import {
  updateNavigatorAnswersAction,
  updateOwnNavigatorAnswersAction,
} from "@/lib/goalNavigatorActions";
import type { NavigatorKind, RecordStatus } from "@/lib/goalNavigatorStore";

/**
 * 承認詳細ページで、提出内容を提出時と同一のシート形式で表示する。
 * 提出者は「進捗を入力」、承認者は「進捗を入力」「評価を入力」でシートを編集できる。
 * 承認済み（approved）は内容保護のため閲覧専用。
 */
export default function ApproverSheetEditor({
  recordId,
  kind,
  status,
  initialAnswers,
  isOwner,
  isApprover,
  profile,
}: {
  recordId: string;
  kind: NavigatorKind;
  status: RecordStatus;
  initialAnswers: Record<string, string>;
  isOwner: boolean;
  isApprover: boolean;
  profile: { name?: string; stage?: string; department?: string; grade?: string };
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const editable = (isOwner || isApprover) && status !== "approved";
  const disabled = !editing;

  const onChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = isApprover
        ? await updateNavigatorAnswersAction(recordId, answers)
        : await updateOwnNavigatorAnswersAction(recordId, answers);
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
        <h2 className="text-base font-bold text-gray-800">入力内容</h2>
        {editable ? (
          editing ? (
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                進捗を入力
              </button>
              {isApprover ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
                >
                  評価を入力
                </button>
              ) : null}
            </div>
          )
        ) : null}
      </div>

      {editing ? (
        <p className="mt-2 text-xs font-bold text-amber-600">
          編集中：シートの内容を修正できます。保存すると上書きされます（ステータスは変わりません）。
        </p>
      ) : null}

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
            disabled={disabled}
            profile={{ name: profile.name, stage: profile.stage, grade: profile.grade }}
          />
        ) : (
          <QualitativeSheet
            answers={answers}
            onChange={onChange}
            disabled={disabled}
            profile={{ name: profile.name, department: profile.department, grade: profile.grade }}
          />
        )}
      </div>
    </div>
  );
}
