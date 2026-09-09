"use client";

import { useState, useTransition } from "react";
import QuantitativeSheet from "@/components/goal-navigator/QuantitativeSheet";
import QualitativeSheet from "@/components/goal-navigator/QualitativeSheet";
import { updateNavigatorAnswersAction } from "@/lib/goalNavigatorActions";
import type { NavigatorKind, RecordStatus } from "@/lib/goalNavigatorStore";

/**
 * 承認詳細ページで、提出内容を提出時と同一のシート形式で表示する。
 * 承認者（canEdit=true）かつ承認待ち/やり直し状態のときは「編集する」→ 値を修正 →「保存」できる。
 * 承認済み・非承認者は読み取り専用シート。
 */
export default function ApproverSheetEditor({
  recordId,
  kind,
  status,
  initialAnswers,
  canEdit,
  profile,
}: {
  recordId: string;
  kind: NavigatorKind;
  status: RecordStatus;
  initialAnswers: Record<string, string>;
  canEdit: boolean;
  profile: { name?: string; stage?: string; department?: string; grade?: string };
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const editable = canEdit && (status === "submitted" || status === "rejected");
  const disabled = !editing;

  const onChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await updateNavigatorAnswersAction(recordId, answers);
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
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
            >
              編集する
            </button>
          )
        ) : null}
      </div>

      {editing ? (
        <p className="mt-2 text-xs font-bold text-amber-600">
          編集モードです。内容を修正して「保存」を押すと提出内容が更新されます（承認状態は変わりません）。
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
