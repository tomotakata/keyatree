"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { saveNavigatorRecord } from "@/lib/goalNavigatorActions";

const sampleAnswers: Record<string, string> = {
  name: "鈴木 一郎",
  department: "営業部 > 第一営業課",
  deadline: "2026年9月末",
  goal: "売上3,000万円達成と顧客満足度向上を両立する",
  why1: "個人目標達成だけでなく、チーム全体の成果向上につなげたいからです。",
  why2: "売上と満足度を両立できれば、紹介案件が増え、継続的に成果が出せます。",
  why3: "現状は売上重視になりやすく、フォロー品質にばらつきが出る場面があるためです。",
  why4: "成果だけでなく、信頼される営業として評価されることに大きな意味があります。",
  purpose: "2026年9月末までに「売上3,000万円達成と顧客満足度向上を両立する」を実現する。背景には売上と信頼の両立があり、その実現を通じて継続的な紹介獲得と営業品質向上を前進させる。",
  kr1: "月間売上 3,000万円達成",
  kr2: "紹介案件比率 25%以上",
  kr3: "顧客満足度アンケート 4.7以上",
  state1: "現在の月間売上は平均2,150万円です。",
  issue1: "月初の商談数が不足し、月末に数字を追う傾向があります。",
  state2: "現在の紹介案件比率は18%です。",
  issue2: "成約後の紹介依頼が仕組み化されていません。",
  state3: "現在の顧客満足度平均は4.3です。",
  issue3: "初回ヒアリング内容の記録にばらつきがあります。",
  action11: "毎週月曜9時に見込み顧客20件へ連絡する。",
  action12: "毎日17時に商談進捗を記録し、週次で売上見込みを更新する。",
  action13: "毎週金曜に上長へ案件進捗レビューを依頼する。",
  action21: "成約後3日以内に紹介依頼メッセージを送る。",
  action22: "毎週2件、既存顧客へフォロー連絡を行う。",
  action23: "紹介成功事例を毎週朝礼で共有する。",
  action31: "初回面談後30分以内にヒアリングメモを入力する。",
  action32: "週1回、顧客対応の振り返りを上長と実施する。",
  action33: "アンケート低評価案件を当日中に確認し改善策を記録する。",
  support: "上長に週1回の進捗レビューと、顧客対応フィードバックを依頼する。",
};

const whyPrompts = [
  "その目標を達成したい理由を教えてください。",
  "それが実現すると、あなたやチームにどんな良い変化がありますか？",
  "その変化が必要だと感じている背景は何ですか？",
  "今回その目標に取り組む一番大きな意味は何でしょうか？",
];

const departmentOptions = [
  "営業部 > 第一営業課",
  "営業部 > 第二営業課",
  "管理部 > 総務課",
  "物件管理部 > 物件課",
  "経営管理部",
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

const steps: { key: StepKey; title: string; prompt: string; placeholder?: string; section: string; kind?: "text" | "textarea" | "select" }[] = [
  { key: "name", title: "STEP0 基本情報", prompt: "お名前を入力してください。", placeholder: "例：鈴木 一郎", section: "基本情報", kind: "text" },
  { key: "department", title: "STEP0 基本情報", prompt: "部署を選択してください。", section: "基本情報", kind: "select" },
  { key: "deadline", title: "STEP1 目標", prompt: "目標の期限を入力してください。", placeholder: "例：2025年9月末", section: "目標", kind: "text" },
  { key: "goal", title: "STEP1 目標", prompt: "目標をひと言で表現してください。", placeholder: "例：新規契約件数を月10件達成する", section: "目標", kind: "textarea" },
  { key: "why1", title: "STEP2 Why", prompt: whyPrompts[0], placeholder: "理由を入力", section: "Why", kind: "textarea" },
  { key: "why2", title: "STEP2 Why", prompt: whyPrompts[1], placeholder: "変化を入力", section: "Why", kind: "textarea" },
  { key: "why3", title: "STEP2 Why", prompt: whyPrompts[2], placeholder: "背景を入力", section: "Why", kind: "textarea" },
  { key: "why4", title: "STEP2 Why", prompt: whyPrompts[3], placeholder: "意味を入力", section: "Why", kind: "textarea" },
  { key: "purpose", title: "STEP3 統合", prompt: "上記を踏まえて、目的と目標を統合した文章を確認・調整してください。", placeholder: "統合文を入力", section: "統合", kind: "textarea" },
  { key: "kr1", title: "STEP4 KR", prompt: "主要な結果（KR）1を入力してください。", placeholder: "例：月間新規契約 10件", section: "KR", kind: "text" },
  { key: "kr2", title: "STEP4 KR", prompt: "主要な結果（KR）2を入力してください。", placeholder: "例：紹介案件比率 20%", section: "KR", kind: "text" },
  { key: "kr3", title: "STEP4 KR", prompt: "主要な結果（KR）3を入力してください。", placeholder: "例：顧客満足度 4.5以上", section: "KR", kind: "text" },
  { key: "state1", title: "STEP5 現状と課題", prompt: "KR1の現状（事実）を入力してください。", placeholder: "例：現在は月6件", section: "現状と課題", kind: "textarea" },
  { key: "issue1", title: "STEP5 現状と課題", prompt: "KR1の課題を入力してください。", placeholder: "例：新規接点数が不足している", section: "現状と課題", kind: "textarea" },
  { key: "state2", title: "STEP5 現状と課題", prompt: "KR2の現状（事実）を入力してください。", placeholder: "例：現在は12%", section: "現状と課題", kind: "textarea" },
  { key: "issue2", title: "STEP5 現状と課題", prompt: "KR2の課題を入力してください。", placeholder: "例：既存顧客への依頼頻度が低い", section: "現状と課題", kind: "textarea" },
  { key: "state3", title: "STEP5 現状と課題", prompt: "KR3の現状（事実）を入力してください。", placeholder: "例：現在は4.1", section: "現状と課題", kind: "textarea" },
  { key: "issue3", title: "STEP5 現状と課題", prompt: "KR3の課題を入力してください。", placeholder: "例：初回対応品質にばらつきがある", section: "現状と課題", kind: "textarea" },
  { key: "action11", title: "STEP6 行動", prompt: "KR1に対する具体行動①を入力してください。", placeholder: "例：毎週月曜に見込み顧客20件へ連絡する", section: "行動", kind: "textarea" },
  { key: "action12", title: "STEP6 行動", prompt: "KR1に対する具体行動②を入力してください。", placeholder: "例：毎日17時に進捗を記録する", section: "行動", kind: "textarea" },
  { key: "action13", title: "STEP6 行動", prompt: "KR1に対する具体行動③を入力してください。", placeholder: "例：週1回ロープレを実施する", section: "行動", kind: "textarea" },
  { key: "action21", title: "STEP6 行動", prompt: "KR2に対する具体行動①を入力してください。", placeholder: "例：毎週3件紹介依頼を行う", section: "行動", kind: "textarea" },
  { key: "action22", title: "STEP6 行動", prompt: "KR2に対する具体行動②を入力してください。", placeholder: "例：成功事例を週次で共有する", section: "行動", kind: "textarea" },
  { key: "action23", title: "STEP6 行動", prompt: "KR2に対する具体行動③を入力してください。", placeholder: "例：紹介依頼のテンプレを整備する", section: "行動", kind: "textarea" },
  { key: "action31", title: "STEP6 行動", prompt: "KR3に対する具体行動①を入力してください。", placeholder: "例：初回対応チェックリストを毎回確認する", section: "行動", kind: "textarea" },
  { key: "action32", title: "STEP6 行動", prompt: "KR3に対する具体行動②を入力してください。", placeholder: "例：週1回フィードバックを受ける", section: "行動", kind: "textarea" },
  { key: "action33", title: "STEP6 行動", prompt: "KR3に対する具体行動③を入力してください。", placeholder: "例：対応後に毎回自己振り返りを行う", section: "行動", kind: "textarea" },
  { key: "support", title: "STEP7 支援設計", prompt: "誰の、どんな支援を受けるか入力してください。", placeholder: "例：上長に週1回進捗レビューを依頼する", section: "支援設計", kind: "textarea" },
];

export default function GoalNavigatorPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [recordId, setRecordId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const current = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const autoPurpose = useMemo(() => {
    if (!answers.goal) return "";
    const whySummary = [answers.why1, answers.why2, answers.why3, answers.why4].filter(Boolean).join(" / ");
    return `${answers.deadline || "期限未設定"}までに「${answers.goal}」を実現する。背景には ${whySummary || "理由整理中"} があり、その実現を通じて成果と行動の両面を前進させる。`;
  }, [answers]);

  const value = current?.key === "purpose" ? (answers.purpose ?? autoPurpose) : (answers[current?.key] ?? "");
  const options = current?.key === "department" ? departmentOptions : [];

  useEffect(() => {
    const saved = window.localStorage.getItem("keyatree_goal_navigator_draft");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { answers?: Record<string, string>; stepIndex?: number; submitted?: boolean; recordId?: string };
      if (parsed.answers) setAnswers(parsed.answers);
      if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);
      if (typeof parsed.submitted === "boolean") setSubmitted(parsed.submitted);
      if (parsed.recordId) setRecordId(parsed.recordId);
    } catch {}
  }, []);

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

  const persistLocal = (nextRecordId?: string) => {
    window.localStorage.setItem(
      "keyatree_goal_navigator_draft",
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
        kind: "quantitative",
        title: answers.goal || "目標設定シート",
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
        kind: "quantitative",
        title: answers.goal || "目標設定シート",
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
            new Paragraph({ children: [new TextRun({ text: "目標設定レポート", bold: true, size: 32 })] }),
            new Paragraph(""),
            new Paragraph({ children: [new TextRun({ text: "1. 基本情報", bold: true })] }),
            new Paragraph(`名前：${answers.name || ""}`),
            new Paragraph(`部署：${answers.department || ""}`),
            new Paragraph({ children: [new TextRun({ text: "2. 目標", bold: true })] }),
            new Paragraph(`期限：${answers.deadline || ""}`),
            new Paragraph(`目標：${answers.goal || ""}`),
            new Paragraph(`統合文：${answers.purpose || autoPurpose || ""}`),
            new Paragraph({ children: [new TextRun({ text: "3. KR", bold: true })] }),
            new Paragraph(`・${answers.kr1 || ""}`),
            new Paragraph(`・${answers.kr2 || ""}`),
            new Paragraph(`・${answers.kr3 || ""}`),
            new Paragraph({ children: [new TextRun({ text: "4. 支援設計", bold: true })] }),
            new Paragraph(answers.support || ""),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "goal-navigator-report.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    let y = 15;
    const lines = [
      "目標設定レポート",
      "",
      "1. 基本情報",
      `名前：${answers.name || ""}`,
      `部署：${answers.department || ""}`,
      "",
      "2. 目標",
      `期限：${answers.deadline || ""}`,
      `目標：${answers.goal || ""}`,
      `統合文：${answers.purpose || autoPurpose || ""}`,
      "",
      "3. KR",
      `・${answers.kr1 || ""}`,
      `・${answers.kr2 || ""}`,
      `・${answers.kr3 || ""}`,
      "",
      "4. 支援設計",
      answers.support || "",
    ];
    pdf.setFont("helvetica", "normal");
    lines.forEach((line) => {
      const wrapped = pdf.splitTextToSize(line, 180);
      pdf.text(wrapped, 15, y);
      y += wrapped.length * 7;
    });
    pdf.save("goal-navigator-report.pdf");
  };

  const fillSample = () => {
    setAnswers(sampleAnswers);
    setStepIndex(0);
    setSubmitted(true);
    setNotice("サンプル回答を反映しました");
    window.setTimeout(() => setNotice(""), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">目標設定ナビゲーター</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
            <p className="text-emerald-100 text-xs font-semibold tracking-wide uppercase">Goal Navigator</p>
            <h1 className="text-white text-2xl font-black mt-1">目標設定ナビゲーター</h1>
            <p className="text-emerald-100 text-sm mt-2">1問ずつ進みながら、目標から具体行動まで整理できます。</p>
            <div className="mt-4">
              <button
                onClick={fillSample}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
              >
                サンプル回答を入れる
              </button>
            </div>
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
                {notice ? (
                  <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {notice}
                  </div>
                ) : null}
                {current.kind === "select" ? (
                  <div className="space-y-3">
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setValue(option)}
                        className={`w-full text-left px-4 py-4 rounded-2xl border transition ${
                          value === option
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : current.kind === "text" ? (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                ) : (
                  <textarea
                    rows={6}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                )}
                <p className="text-xs text-gray-400 mt-2">本番画面では質問を一度に1つだけ表示する運用です。</p>
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
                    className="px-5 py-3 rounded-xl border border-emerald-200 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
                  >
                    {isPending ? "保存中..." : "下書き保存"}
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
                <p className="text-emerald-600 text-xs mt-1">運用画面向けのサンプル出力です。</p>
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
                  もう一度入力
                </button>
                <button
                  onClick={downloadWord}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-sm text-white font-bold hover:bg-emerald-700 transition"
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
              <Link href="/goal-navigator/history" className="text-sm text-emerald-600 hover:underline font-medium">
                目標設定の保存履歴を見る
              </Link>
              <Link href="/approvals/goal-navigators" className="text-sm text-amber-600 hover:underline font-medium">
                承認一覧を見る
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">この画面でできること</h3>
            <ul className="space-y-2 text-sm text-gray-600 leading-6">
              <li>・STEP順に目標設定を進行</li>
              <li>・Why 4問の深掘り</li>
              <li>・KR 3件の整理</li>
              <li>・行動計画と支援設計の作成</li>
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
        </aside>
      </main>
    </div>
  );
}