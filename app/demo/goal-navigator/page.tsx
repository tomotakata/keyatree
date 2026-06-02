"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const whyPrompts = [
  "その目標を達成したい理由を教えてください。",
  "それが実現すると、あなたやチームにどんな良い変化がありますか？",
  "その変化が必要だと感じている背景は何ですか？",
  "今回その目標に取り組む一番大きな意味は何でしょうか？",
];

type StepKey =
  | "name"
  | "department"
  | "deadline"
  | "goal"
  | "why1"
  | "why2"
  | "why3"
  | "why4"
  | "purpose"
  | "kr1"
  | "kr2"
  | "kr3"
  | "state1"
  | "issue1"
  | "state2"
  | "issue2"
  | "state3"
  | "issue3"
  | "action11"
  | "action12"
  | "action13"
  | "action21"
  | "action22"
  | "action23"
  | "action31"
  | "action32"
  | "action33"
  | "support";

const steps: { key: StepKey; title: string; prompt: string; placeholder: string; section: string }[] = [
  { key: "name", title: "STEP0 基本情報", prompt: "お名前を入力してください。", placeholder: "例：鈴木 一郎", section: "基本情報" },
  { key: "department", title: "STEP0 基本情報", prompt: "部署名または役割・チーム名を入力してください。", placeholder: "例：営業部 第一営業課", section: "基本情報" },
  { key: "deadline", title: "STEP1 目標", prompt: "目標の期限を入力してください。", placeholder: "例：2025年9月末", section: "目標" },
  { key: "goal", title: "STEP1 目標", prompt: "目標をひと言で表現してください。", placeholder: "例：新規契約件数を月10件達成する", section: "目標" },
  { key: "why1", title: "STEP2 Why", prompt: whyPrompts[0], placeholder: "理由を入力", section: "Why" },
  { key: "why2", title: "STEP2 Why", prompt: whyPrompts[1], placeholder: "変化を入力", section: "Why" },
  { key: "why3", title: "STEP2 Why", prompt: whyPrompts[2], placeholder: "背景を入力", section: "Why" },
  { key: "why4", title: "STEP2 Why", prompt: whyPrompts[3], placeholder: "意味を入力", section: "Why" },
  { key: "purpose", title: "STEP3 統合", prompt: "上記を踏まえて、目的と目標を統合した文章を確認・調整してください。", placeholder: "統合文を入力", section: "統合" },
  { key: "kr1", title: "STEP4 KR", prompt: "主要な結果（KR）1を入力してください。", placeholder: "例：月間新規契約 10件", section: "KR" },
  { key: "kr2", title: "STEP4 KR", prompt: "主要な結果（KR）2を入力してください。", placeholder: "例：紹介案件比率 20%", section: "KR" },
  { key: "kr3", title: "STEP4 KR", prompt: "主要な結果（KR）3を入力してください。", placeholder: "例：顧客満足度 4.5以上", section: "KR" },
  { key: "state1", title: "STEP5 現状と課題", prompt: "KR1の現状（事実）を入力してください。", placeholder: "例：現在は月6件", section: "現状と課題" },
  { key: "issue1", title: "STEP5 現状と課題", prompt: "KR1の課題を入力してください。", placeholder: "例：新規接点数が不足している", section: "現状と課題" },
  { key: "state2", title: "STEP5 現状と課題", prompt: "KR2の現状（事実）を入力してください。", placeholder: "例：現在は12%", section: "現状と課題" },
  { key: "issue2", title: "STEP5 現状と課題", prompt: "KR2の課題を入力してください。", placeholder: "例：既存顧客への依頼頻度が低い", section: "現状と課題" },
  { key: "state3", title: "STEP5 現状と課題", prompt: "KR3の現状（事実）を入力してください。", placeholder: "例：現在は4.1", section: "現状と課題" },
  { key: "issue3", title: "STEP5 現状と課題", prompt: "KR3の課題を入力してください。", placeholder: "例：初回対応品質にばらつきがある", section: "現状と課題" },
  { key: "action11", title: "STEP6 行動", prompt: "KR1に対する具体行動①を入力してください。", placeholder: "例：毎週月曜に見込み顧客20件へ連絡する", section: "行動" },
  { key: "action12", title: "STEP6 行動", prompt: "KR1に対する具体行動②を入力してください。", placeholder: "例：毎日17時に進捗を記録する", section: "行動" },
  { key: "action13", title: "STEP6 行動", prompt: "KR1に対する具体行動③を入力してください。", placeholder: "例：週1回ロープレを実施する", section: "行動" },
  { key: "action21", title: "STEP6 行動", prompt: "KR2に対する具体行動①を入力してください。", placeholder: "例：毎週3件紹介依頼を行う", section: "行動" },
  { key: "action22", title: "STEP6 行動", prompt: "KR2に対する具体行動②を入力してください。", placeholder: "例：成功事例を週次で共有する", section: "行動" },
  { key: "action23", title: "STEP6 行動", prompt: "KR2に対する具体行動③を入力してください。", placeholder: "例：紹介依頼のテンプレを整備する", section: "行動" },
  { key: "action31", title: "STEP6 行動", prompt: "KR3に対する具体行動①を入力してください。", placeholder: "例：初回対応チェックリストを毎回確認する", section: "行動" },
  { key: "action32", title: "STEP6 行動", prompt: "KR3に対する具体行動②を入力してください。", placeholder: "例：週1回フィードバックを受ける", section: "行動" },
  { key: "action33", title: "STEP6 行動", prompt: "KR3に対する具体行動③を入力してください。", placeholder: "例：対応後に毎回自己振り返りを行う", section: "行動" },
  { key: "support", title: "STEP7 支援設計", prompt: "誰の、どんな支援を受けるか入力してください。", placeholder: "例：上長に週1回進捗レビューを依頼する", section: "支援設計" },
];

export default function GoalNavigatorDemoPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const current = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const autoPurpose = useMemo(() => {
    if (!answers.goal) return "";
    const whySummary = [answers.why1, answers.why2, answers.why3, answers.why4].filter(Boolean).join(" / ");
    return `${answers.deadline || "期限未設定"}までに「${answers.goal}」を実現する。背景には ${whySummary || "理由整理中"} があり、その実現を通じて成果と行動の両面を前進させる。`;
  }, [answers]);

  const value = current?.key === "purpose" ? (answers.purpose ?? autoPurpose) : (answers[current?.key] ?? "");

  const setValue = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [current.key]: val,
    }));
  };

  const next = () => {
    if (!value?.trim()) return;
    if (stepIndex === steps.length - 1) {
      setSubmitted(true);
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/docs" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/docs" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree Docs</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">目標設定ナビゲーター デモ</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
            <p className="text-emerald-100 text-xs font-semibold tracking-wide uppercase">Interactive Demo</p>
            <h1 className="text-white text-2xl font-black mt-1">目標設定ナビゲーター</h1>
            <p className="text-emerald-100 text-sm mt-2">1問ずつ進みながら、目標から具体行動まで整理するデモです。</p>
          </div>

          {!submitted ? (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{current.title}</span>
                  <span>{stepIndex + 1} / {steps.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div>
                <span className="inline-flex text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {current.section}
                </span>
                <h2 className="text-xl font-bold text-gray-800 mt-4 leading-relaxed">{current.prompt}</h2>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <p className="text-xs text-gray-400 mt-2">質問は一度に1つだけ表示する仕様を想定しています。</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={prev}
                  disabled={stepIndex === 0}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  戻る
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => alert("下書き保存デモです。実装時はDBへ保存します。")}
                    className="px-5 py-3 rounded-xl border border-emerald-200 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
                  >
                    下書き保存
                  </button>
                  <button
                    onClick={next}
                    className="px-5 py-3 rounded-xl bg-emerald-500 text-sm text-white font-bold hover:bg-emerald-600 transition disabled:opacity-40"
                  >
                    {stepIndex === steps.length - 1 ? "レポート生成" : "次へ"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                <p className="text-emerald-700 text-sm font-bold">レポート生成が完了しました</p>
                <p className="text-emerald-600 text-xs mt-1">Word提出前提の最終アウトプットデモです。</p>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">目標設定レポート</h2>
                </div>
                <div className="p-5 space-y-5 text-sm text-gray-700 leading-7">
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">1. 基本情報</h3>
                    <p>名前：{answers.name}</p>
                    <p>部署：{answers.department}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">2. 目標</h3>
                    <p>期限：{answers.deadline}</p>
                    <p>目標：{answers.goal}</p>
                    <p>統合文：{answers.purpose || autoPurpose}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">3. KR</h3>
                    <ul className="list-disc pl-5">
                      <li>{answers.kr1}</li>
                      <li>{answers.kr2}</li>
                      <li>{answers.kr3}</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">4. 支援設計</h3>
                    <p>{answers.support}</p>
                  </section>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setStepIndex(0);
                  }}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  もう一度試す
                </button>
                <button
                  onClick={() => alert("デモです。実装時はWord/PDFダウンロードを生成します。")}
                  className="px-5 py-3 rounded-xl bg-emerald-500 text-sm text-white font-bold hover:bg-emerald-600 transition"
                >
                  Word出力デモ
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">このデモで見られること</h3>
            <ul className="space-y-2 text-sm text-gray-600 leading-6">
              <li>・1問ずつ進むウィザードUI</li>
              <li>・目標 → Why → KR → 行動の流れ</li>
              <li>・途中保存の想定UI</li>
              <li>・最終レポート生成の流れ</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">入力サマリー</h3>
            <div className="space-y-3 text-sm">
              {[
                ["名前", answers.name],
                ["部署", answers.department],
                ["期限", answers.deadline],
                ["目標", answers.goal],
                ["目的統合", answers.purpose || autoPurpose],
                ["KR1", answers.kr1],
                ["KR2", answers.kr2],
                ["KR3", answers.kr3],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-gray-700 leading-6">{(val as string) || "未入力"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <h3 className="text-sm font-bold text-amber-700 mb-2">実装メモ</h3>
            <p className="text-sm text-amber-700 leading-6">
              本実装では、下書き保存・上長承認・Word出力・監査ログ・進捗再開をDB連携で持たせる想定です。
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
