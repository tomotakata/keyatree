"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { saveNavigatorRecord } from "@/lib/goalNavigatorActions";

const stageOptions = ["Stage 1 基礎遂行", "Stage 2 自律推進", "Stage 3 周囲牽引"];
const departmentOptions = [
  "営業部 > 第一営業課",
  "営業部 > 第二営業課",
  "管理部 > 総務課",
  "物件管理部 > 物件課",
  "経営管理部",
];
const gradeMap: Record<string, string[]> = {
  "Stage 1 基礎遂行": ["Grade A", "Grade B"],
  "Stage 2 自律推進": ["Grade C", "Grade D"],
  "Stage 3 周囲牽引": ["Grade E", "Grade F"],
};
const categoryOptions = ["主体性", "チームワーク", "顧客志向", "改善推進"];
const competencyOptions = [
  { no: 12, text: "自ら課題を見つけ、必要な行動を主体的に起こしている。" },
  { no: 37, text: "周囲と適切に連携しながら、目標達成に向けて協働している。" },
  { no: 58, text: "相手の立場を理解し、期待を上回る対応を意識している。" },
  { no: 91, text: "現状を見直し、より良い進め方へ改善し続けている。" },
];

type Step =
  | "name"
  | "department"
  | "stage"
  | "grade"
  | "category"
  | "competency"
  | "deadline"
  | "goal"
  | "action1"
  | "action2"
  | "action3"
  | "confirm";

const flow: { key: Step; title: string; kind: "text" | "select" | "textarea"; prompt: string; placeholder?: string }[] = [
  { key: "name", title: "初期ヒアリング", kind: "text", prompt: "お名前を入力してください。", placeholder: "例：鈴木 一郎" },
  { key: "department", title: "初期ヒアリング", kind: "select", prompt: "部署を選択してください。" },
  { key: "stage", title: "PRE-STEP A", kind: "select", prompt: "ステージを選択してください。" },
  { key: "grade", title: "PRE-STEP B", kind: "select", prompt: "グレードを選択してください。" },
  { key: "category", title: "PRE-STEP C", kind: "select", prompt: "定性目標カテゴリを選択してください。" },
  { key: "competency", title: "PRE-STEP D", kind: "select", prompt: "コンピテンシーを選択してください。" },
  { key: "deadline", title: "STEP0", kind: "text", prompt: "期限を入力してください。", placeholder: "例：2025年9月末" },
  { key: "goal", title: "STEP0", kind: "textarea", prompt: "目標文を入力してください。", placeholder: "例：チーム内の報連相の質を高め、業務連携の精度を上げる。" },
  { key: "action1", title: "STEP1", kind: "textarea", prompt: "具体行動①を入力してください。", placeholder: "例：毎朝チーム共有事項を3分で整理して発信する。" },
  { key: "action2", title: "STEP1", kind: "textarea", prompt: "具体行動②を入力してください。", placeholder: "例：週1回、上長に相談事項を事前整理して共有する。" },
  { key: "action3", title: "STEP1", kind: "textarea", prompt: "具体行動③を入力してください。", placeholder: "例：引き継ぎ時にチェックリストを使って確認する。" },
  { key: "confirm", title: "STEP3", kind: "textarea", prompt: "最終確認です。必要なら補足メモを入力してください。", placeholder: "補足があれば入力" },
];

export default function QualitativeGoalNavigatorPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [recordId, setRecordId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const current = flow[stepIndex];
  const progress = Math.round(((stepIndex + 1) / flow.length) * 100);
  const gradeOptions = gradeMap[answers.stage] ?? [];

  const options = useMemo(() => {
    if (current.key === "department") return departmentOptions;
    if (current.key === "stage") return stageOptions;
    if (current.key === "grade") return gradeOptions;
    if (current.key === "category") return categoryOptions;
    if (current.key === "competency") return competencyOptions.map((item) => `No.${item.no} ${item.text}`);
    return [] as string[];
  }, [current.key, gradeOptions]);

  const currentValue = answers[current.key] ?? "";

  useEffect(() => {
    const saved = window.localStorage.getItem("keyatree_qualitative_goal_navigator_draft");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { answers?: Record<string, string>; stepIndex?: number; submitted?: boolean; recordId?: string };
      if (parsed.answers) setAnswers(parsed.answers);
      if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);
      if (typeof parsed.submitted === "boolean") setSubmitted(parsed.submitted);
      if (parsed.recordId) setRecordId(parsed.recordId);
    } catch {}
  }, []);

  const onChange = (value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [current.key]: value };
      if (current.key === "stage") {
        next.grade = "";
      }
      return next;
    });
  };

  const next = () => {
    if (!currentValue.trim() && current.key !== "confirm") return;
    if (stepIndex === flow.length - 1) {
      setSubmitted(true);
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  const persistLocal = (nextRecordId?: string) => {
    window.localStorage.setItem(
      "keyatree_qualitative_goal_navigator_draft",
      JSON.stringify({
        answers,
        stepIndex,
        submitted,
        recordId: nextRecordId ?? recordId,
        savedAt: new Date().toISOString(),
      })
    );
  };

  const saveDraft = () => {
    startTransition(async () => {
      const result = await saveNavigatorRecord({
        id: recordId || undefined,
        kind: "qualitative",
        title: answers.goal || "定性目標設定シート",
        department: answers.department || "",
        answers,
        status: "draft",
      });
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      setRecordId(result.record.id);
      persistLocal(result.record.id);
      setNotice("下書きを保存しました");
      window.setTimeout(() => setNotice(""), 2500);
    });
  };

  const submitForApproval = () => {
    startTransition(async () => {
      const result = await saveNavigatorRecord({
        id: recordId || undefined,
        kind: "qualitative",
        title: answers.goal || "定性目標設定シート",
        department: answers.department || "",
        answers,
        status: "submitted",
      });
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      setRecordId(result.record.id);
      persistLocal(result.record.id);
      setNotice("承認依頼を送信しました");
      window.setTimeout(() => setNotice(""), 2500);
    });
  };

  const downloadWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun({ text: "定性目標設定レポート", bold: true, size: 32 })] }),
            new Paragraph(""),
            new Paragraph({ children: [new TextRun({ text: "表紙情報", bold: true })] }),
            new Paragraph(`名前：${answers.name || ""}`),
            new Paragraph(`部署：${answers.department || ""}`),
            new Paragraph(`作成日：${new Date().toLocaleDateString("ja-JP")}`),
            new Paragraph({ children: [new TextRun({ text: "1. 目標", bold: true })] }),
            new Paragraph(`期限：${answers.deadline || ""}`),
            new Paragraph(`目標文：${answers.goal || ""}`),
            new Paragraph({ children: [new TextRun({ text: "2. 選択した定性目標", bold: true })] }),
            new Paragraph(`ステージ：${answers.stage || ""}`),
            new Paragraph(`グレード：${answers.grade || ""}`),
            new Paragraph(`定性目標カテゴリ：${answers.category || ""}`),
            new Paragraph(`選択コンピテンシー：${answers.competency || ""}`),
            new Paragraph({ children: [new TextRun({ text: "3. 行動計画", bold: true })] }),
            new Paragraph(`・${answers.action1 || ""}`),
            new Paragraph(`・${answers.action2 || ""}`),
            new Paragraph(`・${answers.action3 || ""}`),
            new Paragraph(""),
            new Paragraph({ children: [new TextRun({ text: "この目標は、今日決めたこの一歩から始まります。", bold: true })] }),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qualitative-goal-navigator-report.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    let y = 15;
    const lines = [
      "定性目標設定レポート",
      "",
      "表紙情報",
      `名前：${answers.name || ""}`,
      `部署：${answers.department || ""}`,
      `作成日：${new Date().toLocaleDateString("ja-JP")}`,
      "",
      "1. 目標",
      `期限：${answers.deadline || ""}`,
      `目標文：${answers.goal || ""}`,
      "",
      "2. 選択した定性目標",
      `ステージ：${answers.stage || ""}`,
      `グレード：${answers.grade || ""}`,
      `定性目標カテゴリ：${answers.category || ""}`,
      `選択コンピテンシー：${answers.competency || ""}`,
      "",
      "3. 行動計画",
      `・${answers.action1 || ""}`,
      `・${answers.action2 || ""}`,
      `・${answers.action3 || ""}`,
      "",
      "この目標は、今日決めたこの一歩から始まります。",
    ];
    pdf.setFont("helvetica", "normal");
    lines.forEach((line) => {
      const wrapped = pdf.splitTextToSize(line, 180);
      pdf.text(wrapped, 15, y);
      y += wrapped.length * 7;
    });
    pdf.save("qualitative-goal-navigator-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-indigo-600 transition">KeyaTree</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">定性目標設定ナビゲーター</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase">Qualitative Goal Navigator</p>
            <h1 className="text-white text-2xl font-black mt-1">定性目標設定ナビゲーター</h1>
            <p className="text-blue-100 text-sm mt-2">選択式で定性目標と3つの行動計画を整理できます。</p>
          </div>

          {!submitted ? (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{current.title}</span>
                  <span>{stepIndex + 1} / {flow.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div>
                <span className="inline-flex text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {current.title}
                </span>
                <h2 className="text-xl font-bold text-gray-800 mt-4 leading-relaxed">{current.prompt}</h2>
              </div>

              <div>
                {notice ? (
                  <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                    {notice}
                  </div>
                ) : null}
                {current.kind === "select" ? (
                  <div className="space-y-3">
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => onChange(option)}
                        className={`w-full text-left px-4 py-4 rounded-2xl border transition ${
                          currentValue === option
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : current.kind === "textarea" ? (
                  <textarea
                    rows={6}
                    value={currentValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                ) : (
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                )}
                <p className="text-xs text-gray-400 mt-2">選択した名称は原文のまま保持する想定です。</p>
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
                    onClick={saveDraft}
                    disabled={isPending}
                    className="px-5 py-3 rounded-xl border border-indigo-200 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    {isPending ? "保存中..." : "下書き保存"}
                  </button>
                  <button
                    onClick={next}
                    className="px-5 py-3 rounded-xl bg-indigo-600 text-sm text-white font-bold hover:bg-indigo-700 transition"
                  >
                    {stepIndex === flow.length - 1 ? "レポート生成" : "次へ"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
                <p className="text-indigo-700 text-sm font-bold">定性目標レポートを生成しました</p>
                <p className="text-indigo-600 text-xs mt-1">運用画面向けのサンプル出力です。</p>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">定性目標設定レポート</h2>
                </div>
                <div className="p-5 space-y-5 text-sm text-gray-700 leading-7">
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">表紙情報</h3>
                    <p>名前：{answers.name}</p>
                    <p>部署：{answers.department}</p>
                    <p>作成日：2025/06/12</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">1. 目標</h3>
                    <p>期限：{answers.deadline}</p>
                    <p>目標文：{answers.goal}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">2. 選択した定性目標</h3>
                    <p>ステージ：{answers.stage}</p>
                    <p>グレード：{answers.grade}</p>
                    <p>定性目標カテゴリ：{answers.category}</p>
                    <p>選択コンピテンシー：{answers.competency}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">3. 行動計画</h3>
                    <ul className="list-disc pl-5">
                      <li>{answers.action1}</li>
                      <li>{answers.action2}</li>
                      <li>{answers.action3}</li>
                    </ul>
                  </section>
                  <p className="font-bold text-indigo-700">この目標は、今日決めたこの一歩から始まります。</p>
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
                  もう一度入力
                </button>
                <button
                  onClick={downloadWord}
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-sm text-white font-bold hover:bg-indigo-700 transition"
                >
                  Word出力
                </button>
                <button
                  onClick={printPdf}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 font-bold hover:bg-gray-50 transition"
                >
                  PDF印刷
                </button>
                <button
                  onClick={submitForApproval}
                  disabled={isPending}
                  className="px-5 py-3 rounded-xl bg-amber-500 text-sm text-white font-bold hover:bg-amber-600 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "送信中..." : "承認依頼を送信"}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">保存・履歴</h3>
            <div className="flex flex-col gap-2">
              <Link href="/qualitative-goal-navigator/history" className="text-sm text-indigo-600 hover:underline font-medium">
                定性目標の保存履歴を見る
              </Link>
              <Link href="/approvals/goal-navigators" className="text-sm text-amber-600 hover:underline font-medium">
                承認一覧を見る
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">この画面でできること</h3>
            <ul className="space-y-2 text-sm text-gray-600 leading-6">
              <li>・初期ヒアリング → PRE-STEP → 目標入力</li>
              <li>・選択肢ベースの定性目標設定</li>
              <li>・行動3つの必須入力</li>
              <li>・レポート形式の確認</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">入力サマリー</h3>
            <div className="space-y-3 text-sm">
              {[
                ["名前", answers.name],
                ["部署", answers.department],
                ["ステージ", answers.stage],
                ["グレード", answers.grade],
                ["カテゴリ", answers.category],
                ["コンピテンシー", answers.competency],
                ["期限", answers.deadline],
                ["目標", answers.goal],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-gray-700 leading-6">{(val as string) || "未入力"}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}