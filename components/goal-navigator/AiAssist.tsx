"use client";

import { useState } from "react";

type AssistMode = "suggest" | "refine" | "generate";

type Props = {
  kind: "quantitative" | "qualitative";
  stepTitle: string;
  section: string;
  prompt: string;
  currentValue: string;
  answers: Record<string, string>;
  onApply: (text: string) => void;
};

const MODE_LABEL: Record<AssistMode, string> = {
  suggest: "AIに提案してもらう",
  refine: "AIで添削",
  generate: "自動生成",
};

export default function AiAssist({
  kind,
  stepTitle,
  section,
  prompt,
  currentValue,
  answers,
  onApply,
}: Props) {
  const [loading, setLoading] = useState<AssistMode | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const run = async (mode: AssistMode) => {
    setLoading(mode);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/goal-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          mode,
          stepTitle,
          section,
          prompt,
          currentValue,
          answers,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          (json?.error ?? "AI応答の取得に失敗しました。") +
            (json?.detail ? `\n(${json.detail})` : "")
        );
        return;
      }
      setResult(json.text ?? "");
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-emerald-700">AIアシスト</span>
        <button
          type="button"
          onClick={() => run("suggest")}
          disabled={loading !== null}
          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {loading === "suggest" ? "生成中..." : MODE_LABEL.suggest}
        </button>
        <button
          type="button"
          onClick={() => run("refine")}
          disabled={loading !== null || !currentValue.trim()}
          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {loading === "refine" ? "添削中..." : MODE_LABEL.refine}
        </button>
        <button
          type="button"
          onClick={() => run("generate")}
          disabled={loading !== null}
          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {loading === "generate" ? "生成中..." : MODE_LABEL.generate}
        </button>
      </div>

      {error ? (
        <p className="mt-2 whitespace-pre-line text-xs font-medium text-red-600">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{result}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(result);
                setResult("");
              }}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600"
            >
              この内容を反映
            </button>
            <button
              type="button"
              onClick={() => setResult("")}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
