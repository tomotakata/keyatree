"use client";

import QualitativeFoundation from "@/components/goal-navigator/QualitativeFoundation";
import QualitativeEvaluationGrid from "@/components/goal-navigator/QualitativeEvaluationGrid";
import QualitativeMessageGrid from "@/components/goal-navigator/QualitativeMessageGrid";
import QualitativeCompetencySection from "@/components/goal-navigator/QualitativeCompetencySection";

/**
 * 定性目標設定シート（入力フォームと同一レイアウト）。
 * 提出フォーム・承認画面の両方で再利用する共有コンポーネント。
 * disabled=true で読み取り専用表示になる。
 * 能力項目の絞り込みは提出者のグレード（profile.grade || answers.grade）を使用する。
 */
export default function QualitativeSheet({
  answers,
  onChange,
  disabled = false,
  profile,
}: {
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  profile: { name?: string; department?: string; grade?: string };
}) {
  const grade = profile.grade || answers.grade || "";

  return (
    <div className="space-y-5">
      {/* 基本情報（名前・所属チーム・グレードはログイン情報から自動取得） */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-4">
          <p className="text-base font-black text-gray-900">基本情報</p>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-600">記入日</span>
            <input
              type="date"
              value={answers.entry_date ?? ""}
              onChange={(e) => onChange("entry_date", e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
            />
          </label>
          {[
            ["名前", answers.name || profile.name],
            ["所属チーム", answers.department || profile.department],
            ["グレード", answers.grade || profile.grade],
          ].map(([label, val]) => (
            <div key={label as string}>
              <span className="mb-1 block text-xs font-bold text-gray-600">{label}</span>
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-800">
                {val || <span className="text-gray-400">未設定</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <QualitativeFoundation defaultOpen={false} />
      <QualitativeEvaluationGrid answers={answers} onChange={onChange} disabled={disabled} />
      <QualitativeMessageGrid answers={answers} onChange={onChange} disabled={disabled} />
      <QualitativeCompetencySection answers={answers} onChange={onChange} disabled={disabled} grade={grade} />
    </div>
  );
}
