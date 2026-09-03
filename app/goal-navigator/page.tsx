"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { saveNavigatorRecord, getMyNavigatorRecords, updateGoalMetricsAction } from "@/lib/goalNavigatorActions";
import type { NavigatorRecord, RecordStatus, ItemComment } from "@/lib/goalNavigatorStore";
import { QUANT_DRAFT_BASE, nsKey } from "@/lib/goalStorage";
import { getClientSession } from "@/lib/clientSession";
import ChatNavigator from "@/components/goal-navigator/ChatNavigator";
import RecordStatusBadge from "@/components/goal-navigator/RecordStatusBadge";
import BackButton from "@/components/BackButton";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 定量目標のヒアリング項目。名前・所属はログイン情報から自動取得するためヒアリングしない。
type StepKey =
  | "company_item"
  | "company_deadline"
  | "company_value"
  | "team_item"
  | "team_deadline"
  | "team_value"
  | "personal_item"
  | "personal_deadline"
  | "personal_value";

const GOAL_VALUE_PROMPT = "達成するべき具体的な目標数値を記載ください。";
const GOAL_ITEM_PROMPT =
  "入力した目標数値が具体的に、どのような目標数値であり、目標を設定した経緯や目標を達成したことによる達成意義を目標項目として回答してください。";
const GOAL_ITEM_PLACEHOLDER = "例：この目標数値が示す内容・目標設定の経緯・達成することの意義";

const steps: { key: StepKey; title: string; prompt: string; placeholder?: string; section: string; kind?: "text" | "textarea" | "select" }[] = [
  // ① 全社定量目標（目標達成期日 → 目標数値 → 目標項目 の順）
  { key: "company_deadline", title: "① 全社定量目標", prompt: "全社定量目標の「目標達成期日」を入力してください。", placeholder: "例：2026-09-30", section: "全社定量目標", kind: "text" },
  { key: "company_value", title: "① 全社定量目標", prompt: GOAL_VALUE_PROMPT, placeholder: "例：36000", section: "全社定量目標", kind: "text" },
  { key: "company_item", title: "① 全社定量目標", prompt: GOAL_ITEM_PROMPT, placeholder: GOAL_ITEM_PLACEHOLDER, section: "全社定量目標", kind: "textarea" },
  // ② チーム定量目標
  { key: "team_deadline", title: "② チーム定量目標", prompt: "チーム定量目標の「目標達成期日」を入力してください。", placeholder: "例：2026-09-30", section: "チーム定量目標", kind: "text" },
  { key: "team_value", title: "② チーム定量目標", prompt: GOAL_VALUE_PROMPT, placeholder: "例：120", section: "チーム定量目標", kind: "text" },
  { key: "team_item", title: "② チーム定量目標", prompt: GOAL_ITEM_PROMPT, placeholder: GOAL_ITEM_PLACEHOLDER, section: "チーム定量目標", kind: "textarea" },
  // ③ 個人定量目標
  { key: "personal_deadline", title: "③ 個人定量目標", prompt: "個人定量目標の「目標達成期日」を入力してください。", placeholder: "例：2026-09-30", section: "個人定量目標", kind: "text" },
  { key: "personal_value", title: "③ 個人定量目標", prompt: GOAL_VALUE_PROMPT, placeholder: "例：10", section: "個人定量目標", kind: "text" },
  { key: "personal_item", title: "③ 個人定量目標", prompt: GOAL_ITEM_PROMPT, placeholder: GOAL_ITEM_PLACEHOLDER, section: "個人定量目標", kind: "textarea" },
];

export default function GoalNavigatorPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [uiMode, setUiMode] = useState<"sheet" | "chat">("sheet");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [recordId, setRecordId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  // 目標項目への承認者コメント（読み取り表示用）／進捗・結果数値の後日更新
  const [itemComments, setItemComments] = useState<ItemComment[]>([]);
  const [savingMetrics, startMetrics] = useTransition();

  // ログイン情報（名前・所属）
  const [me, setMe] = useState<{ name: string; org: string; stage: string; grade: string }>({ name: "", org: "", stage: "", grade: "" });

  // 一覧 / 編集 の表示モード
  const [mode, setMode] = useState<"list" | "editor">("list");
  const [records, setRecords] = useState<NavigatorRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activeStatus, setActiveStatus] = useState<RecordStatus | "new">("new");
  const [reviewComment, setReviewComment] = useState("");

  const readOnly = activeStatus === "submitted" || activeStatus === "approved";

  const refreshRecords = () => {
    setLoadingRecords(true);
    return getMyNavigatorRecords("quantitative")
      .then((recs) => setRecords(recs))
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false));
  };

  useEffect(() => {
    let alive = true;
    getMyNavigatorRecords("quantitative")
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

  // ログイン中の名前・ステージ・グレード・所属を取得（すべてログイン情報から自動取得）
  useEffect(() => {
    let alive = true;
    const s = getClientSession();
    if (!s) return;
    const name = s.name || "";
    if (alive) setMe((prev) => ({ ...prev, name }));
    const empId = s.employeeId || s.id;
    if (!empId) return;
    fetch(`/api/staff/${empId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const staff = d?.staff ?? {};
        const org = staff.team || staff.department || "";
        const stage = staff.grade || ""; // マスター上「ステージ」区分
        const grade = staff.position || ""; // 役職＝グレード
        if (alive) setMe((prev) => ({ name: prev.name || name, org, stage, grade }));
      })
      .catch(() => {});
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
    setItemComments([]);
    setUiMode("sheet");
    setNotice("");
    setMode("editor");
  };

  const loadRecord = (record: NavigatorRecord) => {
    setAnswers(record.answers || {});
    setRecordId(record.id);
    setStepIndex(0);
    setActiveStatus(record.status);
    setReviewComment(record.reviewComment || "");
    setItemComments(record.itemComments ?? []);
    setUiMode("sheet");
    setNotice("");
    // 下書き・やり直し依頼は編集モード、提出済み・承認済みはレポート（閲覧）表示
    setSubmitted(record.status === "submitted" || record.status === "approved");
    setMode("editor");
  };

  const backToList = () => {
    setMode("list");
    refreshRecords();
  };

  const recordTitle = () =>
    answers.personal_item || answers.company_item || answers.team_item || "定量目標設定シート";

  const persistLocal = (nextRecordId?: string) => {
    window.localStorage.setItem(
      nsKey(QUANT_DRAFT_BASE),
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
        kind: "quantitative",
        title: recordTitle(),
        department: me.org || "",
        answers: { ...answers, name: me.name, org: me.org },
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
        kind: "quantitative",
        title: recordTitle(),
        department: me.org || "",
        answers: { ...answers, name: me.name, org: me.org },
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
    const block = (label: string, item?: string, deadline?: string, val?: string) => [
      new Paragraph({ children: [new TextRun({ text: label, bold: true })] }),
      new Paragraph(`目標項目：${item || ""}`),
      new Paragraph(`目標達成期日：${deadline || ""}`),
      new Paragraph(`目標数値：${val || ""}`),
      new Paragraph(""),
    ];
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun({ text: "定量目標設定レポート", bold: true, size: 32 })] }),
            new Paragraph(""),
            new Paragraph({ children: [new TextRun({ text: "1. 基本情報", bold: true })] }),
            new Paragraph(`名前：${me.name || ""}`),
            new Paragraph(`所属：${me.org || ""}`),
            new Paragraph(""),
            ...block("2. 全社定量目標", answers.company_item, answers.company_deadline, answers.company_value),
            ...block("3. チーム定量目標", answers.team_item, answers.team_deadline, answers.team_value),
            ...block("4. 個人定量目標", answers.personal_item, answers.personal_deadline, answers.personal_value),
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
    pdf.save("goal-navigator-report.pdf");
  };

  const setMetric = (key: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const saveMetrics = () => {
    if (!recordId) {
      setNotice("先に目標を保存（下書き/承認依頼）してから進捗・結果数値を入力できます");
      window.setTimeout(() => setNotice(""), 3500);
      return;
    }
    startMetrics(async () => {
      const res = await updateGoalMetricsAction(recordId, {
        company_progress: answers.company_progress ?? "",
        company_result: answers.company_result ?? "",
        team_progress: answers.team_progress ?? "",
        team_result: answers.team_result ?? "",
        personal_progress: answers.personal_progress ?? "",
        personal_result: answers.personal_result ?? "",
      });
      if (!res.ok) {
        setNotice(res.message);
        return;
      }
      setNotice("進捗数値・結果数値を保存しました");
      window.setTimeout(() => setNotice(""), 2500);
    });
  };

  const commentsFor = (target: ItemComment["target"]) =>
    [...itemComments].filter((c) => c.target === target).sort((a, b) => a.at.localeCompare(b.at));

  const metricRow = (label: string, prefix: "company" | "team" | "personal") => (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-[11px] text-gray-400">
          進捗数値
          <input
            type="text"
            inputMode="numeric"
            value={answers[`${prefix}_progress`] ?? ""}
            onChange={(e) => setMetric(`${prefix}_progress`, e.target.value)}
            placeholder="数字のみ"
            className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="text-[11px] text-gray-400">
          結果数値
          <input
            type="text"
            inputMode="numeric"
            value={answers[`${prefix}_result`] ?? ""}
            onChange={(e) => setMetric(`${prefix}_result`, e.target.value)}
            placeholder="数字のみ"
            className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>
    </div>
  );

  const commentList = (target: ItemComment["target"]) => {
    const list = commentsFor(target);
    if (list.length === 0) return null;
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-xs font-bold text-amber-600">承認者コメント</p>
        {list.map((c) => (
          <div key={c.id} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700">{c.authorName}</span>
              <span className="text-[11px] text-gray-400">{formatDate(c.at)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{c.body}</p>
          </div>
        ))}
      </div>
    );
  };

  const goalBlock = (label: string, target: ItemComment["target"], item?: string, deadline?: string, val?: string, prefix?: "company" | "team" | "personal") => (
    <section>
      <h3 className="font-bold text-gray-900 mb-2">{label}</h3>
      <p>目標達成期日：{deadline || "未入力"}</p>
      <p>目標数値：{val || "未入力"}</p>
      <p>目標項目：{item || "未入力"}</p>
      {prefix ? (
        <p className="text-gray-500">
          進捗数値：{answers[`${prefix}_progress`] || "-"} ／ 結果数値：{answers[`${prefix}_result`] || "-"}
        </p>
      ) : null}
      {commentList(target)}
    </section>
  );

  // ---- シート入力用の入力ヘルパー（関数呼び出しでJSXを返す＝再マウントによるフォーカス喪失を防ぐ）----
  const sheetDisabled = readOnly;
  const areaCls =
    "mt-1 w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-50 disabled:text-gray-500";
  const inputCls =
    "mt-1 w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-50 disabled:text-gray-500";
  const setA = (k: string, v: string) => setAnswers((p) => ({ ...p, [k]: v }));
  const fArea = (k: string, label: string, placeholder?: string, rows = 4) => (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <textarea rows={rows} value={answers[k] ?? ""} onChange={(e) => setA(k, e.target.value)} placeholder={placeholder} disabled={sheetDisabled} className={areaCls} />
    </label>
  );
  const fText = (k: string, label: string, placeholder?: string) => (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input type="text" value={answers[k] ?? ""} onChange={(e) => setA(k, e.target.value)} placeholder={placeholder} disabled={sheetDisabled} className={inputCls} />
    </label>
  );
  const fDate = (k: string, label: string) => (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input type="date" value={answers[k] ?? ""} onChange={(e) => setA(k, e.target.value)} disabled={sheetDisabled} className={inputCls} />
    </label>
  );
  const fNum = (k: string, label: string, placeholder = "数字のみ入力・単位入力不要") => (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input type="text" inputMode="numeric" value={answers[k] ?? ""} onChange={(e) => setA(k, e.target.value)} placeholder={placeholder} disabled={sheetDisabled} className={inputCls} />
    </label>
  );
  const sectionTitle = (label: string, hint?: string) => (
    <div className="text-center">
      <div className="border-t border-dashed border-gray-300" />
      <p className="py-2 text-sm font-bold text-gray-700">{label}</p>
      {hint ? <p className="-mt-1 pb-1 text-[11px] text-gray-400">{hint}</p> : null}
      <div className="border-t border-dashed border-gray-300" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <BackButton />
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">K.AI</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">目標設定ナビゲーター</span>
        </div>
      </header>

      {mode === "list" ? (
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6">
              <p className="text-emerald-100 text-xs font-semibold tracking-wide uppercase">Goal Navigator</p>
              <h1 className="text-white text-2xl font-black mt-1">目標設定ナビゲーター</h1>
              <p className="text-emerald-100 text-sm mt-2">新しく目標設定を作成するか、これまでの記録の続きを進められます。</p>
              <button
                onClick={startNew}
                className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                ＋ 新しく目標を作成
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">これまでの記録</h2>
                <div className="flex items-center gap-3 text-xs">
                  <Link href="/goal-navigator/history" className="text-emerald-600 hover:underline font-medium">保存履歴</Link>
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
                    className="mt-4 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
                  >
                    最初の目標を作成する
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
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-emerald-200"
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
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
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
      <main className={`mx-auto px-4 py-8 grid gap-6 ${sidebarOpen ? "max-w-7xl lg:grid-cols-[1.3fr_0.7fr]" : "max-w-6xl lg:grid-cols-1"}`}>
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-emerald-100 text-xs font-semibold tracking-wide uppercase">Goal Navigator</p>
              <button
                onClick={backToList}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/25"
              >
                ← 一覧へ戻る
              </button>
            </div>
            <h1 className="text-white text-2xl font-black mt-1">目標設定ナビゲーター</h1>
            <p className="text-emerald-100 text-sm mt-2">全社・チーム・個人の定量目標を順に入力できます。</p>
            <p className="text-emerald-50/90 text-xs mt-2">
              入力者：<span className="font-bold">{me.name || "（ログイン情報を取得中）"}</span>
              {me.org ? <span> ・ 所属：<span className="font-bold">{me.org}</span></span> : null}
            </p>
            {activeStatus === "rejected" && reviewComment && (
              <div className="mt-4 rounded-xl border border-white/40 bg-white/15 p-3 backdrop-blur">
                <p className="text-[11px] font-bold text-white">やり直し依頼のコメント</p>
                <p className="mt-1 text-xs text-white/90 leading-5 whitespace-pre-wrap">{reviewComment}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl bg-white/15 p-1 backdrop-blur">
                <button
                  onClick={() => setUiMode("sheet")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    uiMode === "sheet" ? "bg-white text-emerald-700" : "text-white hover:bg-white/10"
                  }`}
                >
                  シート入力
                </button>
                <button
                  onClick={() => setUiMode("chat")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    uiMode === "chat" ? "bg-white text-emerald-700" : "text-white hover:bg-white/10"
                  }`}
                >
                  チャットで進める
                </button>
              </div>
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/25"
              >
                {sidebarOpen ? "詳細パネルを閉じて広く使う" : "進捗・履歴などの詳細パネルを開く"}
              </button>
            </div>
          </div>

          {uiMode === "chat" && !submitted ? (
            <ChatNavigator
              kind="quantitative"
              steps={steps.map((s) => ({
                key: s.key,
                title: s.title,
                prompt: s.prompt,
                kind: s.kind === "select" ? "select" : s.kind === "text" ? "text" : "textarea",
                placeholder: s.placeholder,
                section: s.section,
              }))}
              answers={answers}
              setAnswer={(key, val) => setAnswers((prev) => ({ ...prev, [key]: val }))}
              optionsFor={() => []}
              autoValueFor={() => ""}
              accent="emerald"
              onComplete={() => setSubmitted(true)}
              onSaveDraft={saveDraft}
              isSaving={isPending}
            />
          ) : !submitted ? (
            <div className="p-6 space-y-8">
              {notice ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {notice}
                </div>
              ) : null}

              {/* ヘッダー：名前・ステージ・グレードはログイン情報から自動取得。記入日のみ入力 */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-800">誰でも簡単にできる目標設定＆振り返り</p>
                <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-400">名前</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{me.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">ステージ</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{me.stage || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">グレード</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{me.grade || "-"}</p>
                  </div>
                  {fDate("entry_date", "記入日")}
                </div>
              </div>

              {/* 定量目標（全社／チーム／個人） */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {[
                    { p: "company", label: "全社定量目標", n: "①" },
                    { p: "team", label: "チーム定量目標", n: "②" },
                    { p: "personal", label: "個人定量目標", n: "③" },
                  ].map((col) => (
                    <div key={col.p} className="space-y-3">
                      {sectionTitle(col.label)}
                      {fDate(`${col.p}_deadline`, `目標達成期日${col.n}`)}
                      {fNum(`${col.p}_value`, `目標数値${col.n}`)}
                      {fNum(`${col.p}_result`, `結果数値${col.n}`)}
                      {fArea(`${col.p}_item`, `目標項目${col.n}`, "この目標数値が示す内容・目標設定の経緯・達成することの意義", 5)}
                      {fArea(`${col.p}_eval1`, `月間定量一次評価者メッセージ${col.n}`, undefined, 3)}
                      {fArea(`${col.p}_eval2`, `月間定量二次評価者メッセージ${col.n}`, undefined, 3)}
                    </div>
                  ))}
                </div>
              </div>

              {/* 目的 */}
              <div className="space-y-4">
                {sectionTitle("目的")}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {fArea("purpose_visible1", "目に見えるもの1", "あなたが目標を達成して周りに与えたい、目に見えるものは何ですか？")}
                  {fArea("purpose_visible2", "目に見えるもの2", "あなたが目標を達成して得たい、目に見えるものは何ですか？")}
                  {fArea("purpose_mind1", "心の変化1", "あなたが目標を達成して周りに与えたい、心の変化はなんですか？")}
                  {fArea("purpose_mind2", "心の変化2", "あなたが目標を達成して得たい、心の変化はなんですか？")}
                </div>
              </div>

              {/* 主要な結果 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`kr${i}`} className="space-y-3">
                    {sectionTitle(`主要な結果${n}`)}
                    {fArea(`kr${i + 1}_item`, `項目${i + 1}`, undefined, 4)}
                    {fNum(`kr${i + 1}_value`, `数字${i + 1}`)}
                  </div>
                ))}
              </div>

              {/* 行動 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`act${i}`} className="space-y-3">
                    {sectionTitle(`主要な結果${n}を達成するための行動`)}
                    {fArea(`action${i + 1}`, `行動${i + 1}`, undefined, 5)}
                  </div>
                ))}
              </div>

              {/* 支援者・依頼日 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`sup${i}`} className="space-y-3">
                    {sectionTitle(`主要な結果${n}を達成するための支援者`)}
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      {fText(`supporter${i + 1}_1`, `依頼者${n}1`)}
                      {fDate(`supporter${i + 1}_1_date`, `依頼日${n}1`)}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      {fText(`supporter${i + 1}_2`, `依頼者${n}2`)}
                      {fDate(`supporter${i + 1}_2_date`, `依頼日${n}2`)}
                    </div>
                  </div>
                ))}
              </div>

              {/* 支援内容 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`supd${i}`} className="space-y-3">
                    {sectionTitle("支援内容")}
                    {fArea(`support_detail${i + 1}`, `支援内容${i + 1}`, undefined, 4)}
                  </div>
                ))}
              </div>

              {/* 中間実績【数字】 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`mid${i}`} className="space-y-3">
                    {sectionTitle("中間実績【数字】")}
                    {fNum(`mid_result${i + 1}`, `中間実績${n}`, "数字のみ入力・単位入力不要")}
                  </div>
                ))}
              </div>

              {/* 月間実績【数字】 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`mon${i}`} className="space-y-3">
                    {sectionTitle("月間実績【数字】")}
                    {fNum(`monthly_result${i + 1}`, `月間実績${n}`, "数字のみ入力・単位入力不要")}
                  </div>
                ))}
              </div>

              {/* 原因（なぜ？を繰り返す：各列5件） */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`cause${i}`} className="space-y-3">
                    {sectionTitle("原因", "「なぜ？」を繰り返し、実績の原因を明確にしましょう！")}
                    {[1, 2, 3, 4, 5].map((r) => (
                      <div key={`c${i}-${r}`}>{fText(`cause${i + 1}_${r}`, `月間原因${n}-${r}`, "なぜ→")}</div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 改善策（各列3件） */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {["①", "②", "③"].map((n, i) => (
                  <div key={`imp${i}`} className="space-y-3">
                    {sectionTitle("改善策", "原因から学習しより良くなるための行動を設定しましょう！")}
                    {[1, 2, 3].map((r) => (
                      <div key={`i${i}-${r}`}>{fText(`improve${i + 1}_${r}`, `月間改善策${n}-${r}`, `${r})`)}</div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 操作ボタン */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5">
                <button
                  onClick={saveDraft}
                  disabled={isPending}
                  className="px-5 py-3 rounded-xl border border-emerald-200 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-50"
                >
                  {isPending ? "保存中..." : "下書き保存"}
                </button>
                <button
                  onClick={() => setSubmitted(true)}
                  className="px-5 py-3 rounded-xl bg-emerald-500 text-sm text-white font-bold hover:bg-emerald-600 transition"
                >
                  レポート生成
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                <p className="text-emerald-700 text-sm font-bold">レポート生成が完了しました</p>
                <p className="text-emerald-600 text-xs mt-1">運用画面向けのサンプル出力です。</p>
              </div>

              <div ref={reportRef} className="border rounded-2xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-5 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">定量目標設定レポート</h2>
                </div>
                <div className="p-5 space-y-5 text-sm text-gray-700 leading-7">
                  <section>
                    <h3 className="font-bold text-gray-900 mb-2">1. 基本情報</h3>
                    <p>名前：{me.name || "-"}</p>
                    <p>所属：{me.org || "-"}</p>
                  </section>
                  {goalBlock("2. 全社定量目標", "company", answers.company_item, answers.company_deadline, answers.company_value, "company")}
                  {goalBlock("3. チーム定量目標", "team", answers.team_item, answers.team_deadline, answers.team_value, "team")}
                  {goalBlock("4. 個人定量目標", "personal", answers.personal_item, answers.personal_deadline, answers.personal_value, "personal")}
                </div>
              </div>

              {notice ? (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-sm text-white font-bold hover:bg-emerald-700 transition"
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

        {sidebarOpen && (
        <aside className="space-y-6">
          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">進捗数値・結果数値</h3>
              <span className="text-[11px] text-gray-400">後日入力できます</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 leading-5">
              各目標の進捗数値・結果数値は、提出後でもここから随時入力・保存できます（承認状態は変わりません）。
            </p>
            <div className="mt-4 space-y-3">
              {metricRow("① 全社定量目標", "company")}
              {metricRow("② チーム定量目標", "team")}
              {metricRow("③ 個人定量目標", "personal")}
            </div>
            <button
              onClick={saveMetrics}
              disabled={savingMetrics || !recordId}
              className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingMetrics ? "保存中..." : "進捗・結果数値を保存"}
            </button>
            {!recordId ? (
              <p className="mt-2 text-[11px] text-amber-600">
                ※ まず下書き保存または承認依頼を行うと入力できます。
              </p>
            ) : null}
          </div>

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
              <li>・名前と所属はログイン情報から自動取得</li>
              <li>・① 全社定量目標を入力</li>
              <li>・② チーム定量目標を入力</li>
              <li>・③ 個人定量目標を入力</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">入力サマリー</h3>
            <div className="space-y-3 text-sm">
              {[
                ["名前", me.name],
                ["所属", me.org],
                ["全社定量目標", answers.company_item],
                ["チーム定量目標", answers.team_item],
                ["個人定量目標", answers.personal_item],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-gray-700 leading-6">{(val as string) || "未入力"}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
        )}
      </main>
      )}
    </div>
  );
}
