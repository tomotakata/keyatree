"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { saveNavigatorRecord, getMyNavigatorRecords } from "@/lib/goalNavigatorActions";
import type { NavigatorRecord, RecordStatus } from "@/lib/goalNavigatorStore";
import { QUAL_DRAFT_BASE, nsKey } from "@/lib/goalStorage";
import AiAssist from "@/components/goal-navigator/AiAssist";
import ChatNavigator from "@/components/goal-navigator/ChatNavigator";
import RecordStatusBadge from "@/components/goal-navigator/RecordStatusBadge";
import BackButton from "@/components/BackButton";
import UnderMaintenance from "@/components/UnderMaintenance";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const sampleAnswers: Record<string, string> = {
  name: "田中 花子",
  department: "管理部 > 総務課",
  stage: "Stage 2 自律推進",
  grade: "Grade D",
  category: "チームワーク",
  competency: "No.37 周囲と適切に連携しながら、目標達成に向けて協働している。",
  deadline: "2026年9月末",
  goal: "部門をまたいだ情報連携の精度を高め、総務対応のスピードを上げる。",
  action1: "毎週月曜に各部門の依頼状況を一覧化して共有する。",
  action2: "問い合わせ対応後、当日中に対応履歴を記録する。",
  action3: "月2回、営業部と連携課題の確認ミーティングを実施する。",
  confirm: "総務課として、他部署との連携品質を高める行動に集中する。",
};

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
  const reportRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [uiMode, setUiMode] = useState<"step" | "chat">("step");
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [recordId, setRecordId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"list" | "editor">("list");
  const [records, setRecords] = useState<NavigatorRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activeStatus, setActiveStatus] = useState<RecordStatus | "new">("new");
  const [reviewComment, setReviewComment] = useState("");
  const readOnly = activeStatus === "submitted" || activeStatus === "approved";

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

  const refreshRecords = () => {
    setLoadingRecords(true);
    return getMyNavigatorRecords("qualitative")
      .then((recs) => setRecords(recs))
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false));
  };

  useEffect(() => {
    let alive = true;
    getMyNavigatorRecords("qualitative")
      .then((recs) => {
        if (alive) setRecords(recs);
      })
      .catch(() => {
        if (alive) setRecords([]);
      })
      .finally(() => {
        if (alive) setLoadingRecords(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const startNew = () => {
    setAnswers({});
    setRecordId("");
    setStepIndex(0);
    setSubmitted(false);
    setActiveStatus("new");
    setReviewComment("");
    setUiMode("step");
    setNotice("");
    setMode("editor");
  };

  const loadRecord = (record: NavigatorRecord) => {
    setAnswers(record.answers || {});
    setRecordId(record.id);
    setStepIndex(0);
    setActiveStatus(record.status);
    setReviewComment(record.reviewComment || "");
    setUiMode("step");
    setNotice("");
    setSubmitted(record.status === "submitted" || record.status === "approved");
    setMode("editor");
  };

  const backToList = () => {
    setMode("list");
    refreshRecords();
  };

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
      nsKey(QUAL_DRAFT_BASE),
      JSON.stringify({
        answers,
        stepIndex,
        submitted,
        recordId: nextRecordId ?? recordId,
        savedAt: new Date().toISOString(),
        status: submitted ? "submitted" : "draft",
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
      setActiveStatus("draft");
      refreshRecords();
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
      setSubmitted(true);
      persistLocal(result.record.id);
      setActiveStatus("submitted");
      refreshRecords();
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

  const printPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("qualitative-goal-navigator-report.pdf");
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
      <UnderMaintenance title="定性目標設定ナビゲーター（定性目標管理）" />
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <BackButton />
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-indigo-600 transition">K.AI</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">定性目標設定ナビゲーター</span>
        </div>
      </header>

      {mode === "list" ? (
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
              <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase">Qualitative Goal Navigator</p>
              <h1 className="text-white text-2xl font-black mt-1">定性目標設定ナビゲーター</h1>
              <p className="text-blue-100 text-sm mt-2">新しく定性目標を作成するか、これまでの記録の続きを進められます。</p>
              <button
                onClick={startNew}
                className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                ＋ 新しく定性目標を作成
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">これまでの記録</h2>
                <div className="flex items-center gap-3 text-xs">
                  <Link href="/qualitative-goal-navigator/history" className="text-indigo-600 hover:underline font-medium">保存履歴</Link>
                  <Link href="/approvals/goal-navigators" className="text-amber-600 hover:underline font-medium">承認一覧</Link>
                </div>
              </div>

              {loadingRecords ? (
                <p className="mt-6 text-sm text-gray-400">読み込み中...</p>
              ) : records.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-500">まだ記録がありません。</p>
                  <button
                    onClick={startNew}
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    最初の定性目標を作成する
                  </button>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {records.map((record) => {
                    const actionLabel =
                      record.status === "draft"
                        ? "続きを編集"
                        : record.status === "rejected"
                        ? "修正する"
                        : "内容を確認";
                    return (
                      <li
                        key={record.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-indigo-200"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-800">{record.title || "無題の目標"}</p>
                              <RecordStatusBadge status={record.status} />
                            </div>
                            {record.department && (
                              <p className="text-xs text-gray-500">{record.department}</p>
                            )}
                            <p className="text-[11px] text-gray-400">
                              更新 {formatDate(record.updatedAt)}
                              {record.submittedAt ? ` ・ 提出 ${formatDate(record.submittedAt)}` : ""}
                              {record.approvedAt ? ` ・ 承認 ${formatDate(record.approvedAt)}` : ""}
                            </p>
                            {record.status === "rejected" && record.reviewComment && (
                              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                                <p className="text-[11px] font-bold text-rose-600">やり直し依頼のコメント</p>
                                <p className="mt-1 text-xs text-rose-700 leading-5 whitespace-pre-wrap">{record.reviewComment}</p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => loadRecord(record)}
                            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                              record.status === "rejected"
                                ? "bg-rose-500 text-white hover:bg-rose-600"
                                : record.status === "draft"
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {actionLabel}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </main>
      ) : (
      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase">Qualitative Goal Navigator</p>
              <button
                onClick={backToList}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/25"
              >
                ← 一覧へ戻る
              </button>
            </div>
            <h1 className="text-white text-2xl font-black mt-1">定性目標設定ナビゲーター</h1>
            <p className="text-blue-100 text-sm mt-2">選択式で定性目標と3つの行動計画を整理できます。</p>
            {activeStatus === "rejected" && reviewComment && (
              <div className="mt-4 rounded-xl border border-white/40 bg-white/15 p-3 backdrop-blur">
                <p className="text-[11px] font-bold text-white">やり直し依頼のコメント</p>
                <p className="mt-1 text-xs text-white/90 leading-5 whitespace-pre-wrap">{reviewComment}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {activeStatus === "new" && (
                <button
                  onClick={fillSample}
                  className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                >
                  サンプル回答を入れる
                </button>
              )}
              <div className="inline-flex rounded-xl bg-white/15 p-1 backdrop-blur">
                <button
                  onClick={() => setUiMode("step")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    uiMode === "step" ? "bg-white text-indigo-700" : "text-white hover:bg-white/10"
                  }`}
                >
                  ステップ入力
                </button>
                <button
                  onClick={() => setUiMode("chat")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    uiMode === "chat" ? "bg-white text-indigo-700" : "text-white hover:bg-white/10"
                  }`}
                >
                  チャットで進める
                </button>
              </div>
            </div>
          </div>

          {uiMode === "chat" && !submitted ? (
            <ChatNavigator
              kind="qualitative"
              steps={flow.map((s) => ({
                key: s.key,
                title: s.title,
                prompt: s.prompt,
                kind: s.kind,
                placeholder: s.placeholder,
                section: s.title,
              }))}
              answers={answers}
              setAnswer={(key, val) =>
                setAnswers((prev) => {
                  const nextState = { ...prev, [key]: val };
                  if (key === "stage") nextState.grade = "";
                  return nextState;
                })
              }
              optionsFor={(key, ans) => {
                if (key === "department") return departmentOptions;
                if (key === "stage") return stageOptions;
                if (key === "grade") return gradeMap[ans.stage] ?? [];
                if (key === "category") return categoryOptions;
                if (key === "competency")
                  return competencyOptions.map((item) => `No.${item.no} ${item.text}`);
                return [];
              }}
              accent="indigo"
              onComplete={() => setSubmitted(true)}
              onSaveDraft={saveDraft}
              isSaving={isPending}
            />
          ) : !submitted ? (
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
                {current.kind !== "select" ? (
                  <AiAssist
                    kind="qualitative"
                    stepKey={current.key}
                    stepTitle={current.title}
                    section={current.title}
                    prompt={current.prompt}
                    currentValue={currentValue}
                    answers={answers}
                    onApply={(text) => onChange(text)}
                  />
                ) : null}
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

              <div ref={reportRef} className="border rounded-2xl overflow-hidden bg-white">
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

              {notice ? (
                <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                  {notice}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {!readOnly && (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setStepIndex(0);
                    }}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
                  >
                    もう一度入力
                  </button>
                )}
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
                  PDF出力
                </button>
                {!readOnly && (
                  <button
                    onClick={submitForApproval}
                    disabled={isPending}
                    className="px-5 py-3 rounded-xl bg-amber-500 text-sm text-white font-bold hover:bg-amber-600 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "送信中..." : activeStatus === "rejected" ? "修正して再申請" : "承認依頼を送信"}
                  </button>
                )}
                {readOnly && (
                  <span className="px-5 py-3 text-sm font-medium text-gray-400">
                    {activeStatus === "approved" ? "承認済みのため編集できません" : "承認待ちのため編集できません"}
                  </span>
                )}
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
      )}
    </div>
  );
}