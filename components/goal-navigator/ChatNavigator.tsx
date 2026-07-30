"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ChatStep = {
  key: string;
  title: string;
  prompt: string;
  kind: "text" | "textarea" | "select";
  placeholder?: string;
  section?: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  pending?: boolean;
};

type Accent = "emerald" | "indigo";

type Props = {
  kind: "quantitative" | "qualitative";
  steps: ChatStep[];
  answers: Record<string, string>;
  setAnswer: (key: string, value: string) => void;
  optionsFor: (key: string, answers: Record<string, string>) => string[];
  autoValueFor?: (key: string, answers: Record<string, string>) => string;
  accent?: Accent;
  onComplete: () => void;
  onSaveDraft: () => void;
  isSaving?: boolean;
};

const THEME: Record<
  Accent,
  {
    grad: string;
    userBubble: string;
    sendBtn: string;
    chip: string;
    ring: string;
    dot: string;
    saveBtn: string;
  }
> = {
  emerald: {
    grad: "from-emerald-500 to-teal-500",
    userBubble: "bg-emerald-500 text-white",
    sendBtn: "bg-emerald-500 hover:bg-emerald-600",
    chip:
      "border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50",
    ring: "focus:ring-emerald-300",
    dot: "bg-emerald-500",
    saveBtn:
      "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
  },
  indigo: {
    grad: "from-blue-600 to-indigo-600",
    userBubble: "bg-indigo-600 text-white",
    sendBtn: "bg-indigo-600 hover:bg-indigo-700",
    chip:
      "border-indigo-200 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50",
    ring: "focus:ring-indigo-300",
    dot: "bg-indigo-500",
    saveBtn:
      "border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
  },
};

let idSeq = 0;
const newId = () => `m${Date.now()}_${idSeq++}`;

export default function ChatNavigator({
  kind,
  steps,
  answers,
  setAnswer,
  optionsFor,
  autoValueFor,
  accent = "emerald",
  onComplete,
  onSaveDraft,
  isSaving,
}: Props) {
  const theme = THEME[accent];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const current = !done && cursor < steps.length ? steps[cursor] : null;
  const options = useMemo(
    () => (current && current.kind === "select" ? optionsFor(current.key, answers) : []),
    [current, answers, optionsFor]
  );

  const push = (msg: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { ...msg, id: newId() }]);

  const questionText = (step: ChatStep, forAnswers: Record<string, string>) => {
    const auto = autoValueFor?.(step.key, forAnswers) ?? "";
    if (auto) {
      return `${step.prompt}\n\nこれまでのお話から案をご用意しました。確認して、必要なら編集して送信してください。`;
    }
    return step.prompt;
  };

  // 初回：あいさつ＋最初の質問
  useEffect(() => {
    if (started.current || steps.length === 0) return;
    started.current = true;
    const first = steps[0];
    const greeting =
      kind === "qualitative"
        ? "こんにちは。定性目標設定ナビゲーターです。ひとつずつ一緒に整理していきましょう。まずは基本情報からお聞きします。"
        : "こんにちは。目標設定ナビゲーターです。ひとつずつ順番に、目標から具体行動まで一緒に整理していきましょう。";
    setMessages([
      { id: newId(), role: "assistant", text: greeting },
      { id: newId(), role: "assistant", text: questionText(first, answers) },
    ]);
    const auto = autoValueFor?.(first.key, answers) ?? "";
    if (auto) setInput(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const advance = (fromIndex: number, updated: Record<string, string>) => {
    const nextIndex = fromIndex + 1;
    if (nextIndex >= steps.length) {
      setDone(true);
      push({
        role: "assistant",
        text:
          "ここまでの入力、おつかれさまでした。すべての項目が整いました。内容を確認してレポートを作成しましょう。",
      });
      return;
    }
    const nextStep = steps[nextIndex];
    setCursor(nextIndex);
    push({ role: "assistant", text: questionText(nextStep, updated) });
    const auto = autoValueFor?.(nextStep.key, updated) ?? "";
    setInput(auto);
  };

  const canGoBack = !loading && (done || cursor > 0);

  const goBack = () => {
    if (!canGoBack) return;
    // 1ステップ = [質問, ユーザー回答, AIコメント] の3メッセージ単位。
    // 直近ブロックを取り除き、ひとつ前の質問を再表示して回答し直せるようにする。
    const targetIndex = done ? steps.length - 1 : cursor - 1;
    if (targetIndex < 0) return;
    setMessages((prev) => prev.slice(0, Math.max(0, prev.length - 3)));
    setDone(false);
    setCursor(targetIndex);
    const targetStep = steps[targetIndex];
    setInput(answers[targetStep.key] ?? "");
  };

  const submitValue = async (rawValue: string) => {
    if (!current || loading) return;
    const value = rawValue.trim();
    if (!value && current.key !== "confirm") return;

    setInput("");
    setAnswer(current.key, value);
    const updated = { ...answers, [current.key]: value };
    push({ role: "user", text: value || "（スキップ）" });

    const stepAtSubmit = current;
    const indexAtSubmit = cursor;

    setLoading(true);
    push({ role: "assistant", text: "", pending: true });
    try {
      const res = await fetch("/api/goal-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          mode: "coach",
          stepKey: stepAtSubmit.key,
          stepTitle: stepAtSubmit.title,
          section: stepAtSubmit.section ?? stepAtSubmit.title,
          prompt: stepAtSubmit.prompt,
          currentValue: value,
          answers: updated,
        }),
      });
      const json = await res.json();
      const comment: string =
        (res.ok && json.text) ||
        "ありがとうございます。受け取りました。次に進みましょう。";
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.pending);
        if (idx >= 0) copy[idx] = { ...copy[idx], text: comment, pending: false };
        return copy;
      });
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.pending);
        if (idx >= 0)
          copy[idx] = {
            ...copy[idx],
            text: "ありがとうございます。受け取りました。次に進みましょう。",
            pending: false,
          };
        return copy;
      });
    } finally {
      setLoading(false);
      advance(indexAtSubmit, updated);
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`bg-gradient-to-r ${theme.grad} px-6 py-5`}>
        <p className="text-white/80 text-xs font-semibold tracking-wide uppercase">
          Chat Mode
        </p>
        <h1 className="text-white text-2xl font-black mt-1">
          {kind === "qualitative" ? "定性目標設定ナビゲーター" : "目標設定ナビゲーター"}
        </h1>
        <p className="text-white/80 text-sm mt-2">
          AIと会話しながら、1問ずつ順番に目標を整理していきます。
        </p>
      </div>

      {/* 進捗 */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>{current ? current.title : "完了"}</span>
          <span>
            {Math.min(cursor + (done ? 0 : 1), steps.length)} / {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`${theme.dot} h-2 rounded-full transition-all duration-300`}
            style={{
              width: `${Math.round(((done ? steps.length : cursor) / steps.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* 会話ログ */}
      <div
        ref={scrollRef}
        className="px-6 py-5 space-y-4 overflow-y-auto"
        style={{ maxHeight: "48vh", minHeight: "320px" }}
      >
        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${theme.dot} text-[11px] font-bold text-white`}
              >
                AI
              </span>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-gray-100 bg-gray-50 px-4 py-3">
                {m.pending ? (
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  </span>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {m.text}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div
                className={`max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 ${theme.userBubble}`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{m.text}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden>←</span> 1つ前に戻る
          </button>
          {!done && cursor > 0 ? (
            <span className="text-[11px] text-gray-400">
              間違えたら「1つ前に戻る」で修正できます
            </span>
          ) : null}
        </div>
        {done ? (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onComplete}
              className={`px-5 py-3 rounded-xl text-sm text-white font-bold transition ${theme.sendBtn}`}
            >
              レポートを確認する
            </button>
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold transition ${theme.saveBtn} disabled:opacity-50`}
            >
              {isSaving ? "保存中..." : "下書き保存"}
            </button>
          </div>
        ) : current && current.kind === "select" ? (
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => submitValue(option)}
                disabled={loading}
                className={`w-full text-left px-4 py-3 rounded-2xl border bg-white text-sm text-gray-700 transition disabled:opacity-50 ${theme.chip}`}
              >
                {option}
              </button>
            ))}
            {options.length === 0 ? (
              <p className="text-xs text-gray-400">
                前の項目を選ぶと、ここに選択肢が表示されます。
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              rows={current?.kind === "textarea" ? 3 : 1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && current?.kind !== "textarea") {
                  e.preventDefault();
                  submitValue(input);
                }
              }}
              placeholder={current?.placeholder ?? "メッセージを入力"}
              disabled={loading}
              className={`flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 ${theme.ring} disabled:opacity-60`}
            />
            <button
              onClick={() => submitValue(input)}
              disabled={loading || (!input.trim() && current?.key !== "confirm")}
              className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-bold text-white transition ${theme.sendBtn} disabled:opacity-40`}
            >
              {loading ? "..." : "送信"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
