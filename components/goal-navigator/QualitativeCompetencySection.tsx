"use client";

import { useState } from "react";
import { competencyItemsForGrade, competencyLabel, bandForGrade } from "@/lib/qualitativeCompetencies";

/**
 * 会社から求められている能力項目①〜⑤（ログイン中スタッフのグレードで選択肢を絞り込み）と、
 * 各項目の「主要な結果」（項目＝テキスト／数字＝数値のみ）を入力するセクション。
 * 項目・数字はスペースが狭いため、押すと中央に大きな編集モーダルが開く。
 * 保存キー: q_comp_N / q_kr_item_N / q_kr_num_N（N=1..5）。
 */

const ITEMS = [1, 2, 3, 4, 5];
const CIRCLED: Record<number, string> = { 1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤" };

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3H3v6M15 21h6v-6M3 3l7 7M21 21l-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function QualitativeCompetencySection({
  answers,
  onChange,
  disabled = false,
  grade = "",
}: {
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  grade?: string;
}) {
  const options = competencyItemsForGrade(grade);
  const band = bandForGrade(grade);

  const [editing, setEditing] = useState<{ key: string; label: string; numeric: boolean } | null>(null);
  const [draft, setDraft] = useState("");
  const [keepOpen, setKeepOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const open = (key: string, label: string, numeric: boolean) => {
    setDraft(answers[key] ?? "");
    setEditing({ key, label, numeric });
    setSavedFlash(false);
  };
  const close = () => {
    setEditing(null);
    setSavedFlash(false);
  };
  const save = () => {
    if (!editing) return;
    onChange(editing.key, draft);
    setSavedFlash(true);
    if (!keepOpen) window.setTimeout(() => close(), 150);
    else window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const onDraftChange = (v: string) => {
    if (editing?.numeric) setDraft(v.replace(/[^0-9.\-]/g, ""));
    else setDraft(v);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-black text-gray-900">会社から求められている能力項目</p>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            {band ? `グレード ${band} の項目を表示中` : "グレード未設定のため全項目を表示"}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-bold text-gray-500">
          あなたのグレードに応じた能力項目から①〜⑤を選び、各項目の主要な結果（項目・数字）を入力してください。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5">
        {ITEMS.map((n) => {
          const compKey = `q_comp_${n}`;
          const itemKey = `q_kr_item_${n}`;
          const numKey = `q_kr_num_${n}`;
          const actionKey = `q_kr_action_${n}`;
          const supporter1Key = `q_supporter_${n}_1`;
          const supporter2Key = `q_supporter_${n}_2`;
          const supportContentKey = `q_support_content_${n}`;
          const supDate1Key = `q_supporter_date_${n}_1`;
          const supDate2Key = `q_supporter_date_${n}_2`;
          return (
            <div key={n} className="flex flex-col rounded-2xl border border-gray-200 p-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-600">
                  会社から求められている能力項目{CIRCLED[n]}
                </span>
                <select
                  value={answers[compKey] ?? ""}
                  onChange={(e) => onChange(compKey, e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">(指定なし)</option>
                  {options.map((item) => {
                    const label = competencyLabel(item);
                    return (
                      <option key={item.no} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>

              <div className="my-2 text-center text-sm font-bold text-gray-400">↓↓</div>

              <div className="mb-3 border-y border-dashed border-gray-300 py-1 text-center text-xs font-black text-gray-700">
                主要な結果{CIRCLED[n]}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="mb-1 block text-xs font-bold text-gray-600">項目 {n}</span>
                  <button
                    type="button"
                    onClick={() => open(itemKey, `項目 ${n}`, false)}
                    disabled={disabled}
                    className="relative flex h-20 w-full items-start rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs leading-5 text-gray-800 transition hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="line-clamp-2 whitespace-pre-wrap pr-6">
                      {answers[itemKey] || <span className="text-gray-400">クリックして入力</span>}
                    </span>
                    <span className="absolute bottom-2 right-2 text-gray-400">
                      <ExpandIcon />
                    </span>
                  </button>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-bold text-gray-600">数字 {n}</span>
                  <button
                    type="button"
                    onClick={() => open(numKey, `数字 ${n}`, true)}
                    disabled={disabled}
                    className="relative flex h-20 w-full items-start rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs leading-5 text-gray-800 transition hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="line-clamp-2 whitespace-pre-wrap pr-6">
                      {answers[numKey] || <span className="text-gray-400">数字のみ入力・クリック</span>}
                    </span>
                    <span className="absolute bottom-2 right-2 text-gray-400">
                      <ExpandIcon />
                    </span>
                  </button>
                </div>
              </div>

              <div className="my-2 text-center text-sm font-bold text-gray-400">↓↓</div>

              <div className="mb-3 border-y border-dashed border-gray-300 py-1 text-center text-xs font-black text-gray-700">
                主要な結果{CIRCLED[n]}を達成するための行動
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold text-gray-600">行動 {n}</span>
                <button
                  type="button"
                  onClick={() => open(actionKey, `行動 ${n}`, false)}
                  disabled={disabled}
                  className="relative flex h-24 w-full items-start rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs leading-5 text-gray-800 transition hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="line-clamp-3 whitespace-pre-wrap pr-6">
                    {answers[actionKey] || <span className="text-gray-400">クリックして入力</span>}
                  </span>
                  <span className="absolute bottom-2 right-2 text-gray-400">
                    <ExpandIcon />
                  </span>
                </button>
              </div>

              <div className="my-2 text-center text-sm font-bold text-gray-400">↓↓</div>

              <div className="mb-3 border-y border-dashed border-gray-300 py-1 text-center text-xs font-black text-gray-700">
                主要な結果{CIRCLED[n]}を達成するための支援者
              </div>
              <div className="space-y-3">
                {[
                  { sKey: supporter1Key, dKey: supDate1Key, idx: 1 },
                  { sKey: supporter2Key, dKey: supDate2Key, idx: 2 },
                ].map(({ sKey, dKey, idx }) => (
                  <div key={idx} className="space-y-2">
                    <div>
                      <span className="mb-1 block text-xs font-bold text-gray-600">
                        依頼者{CIRCLED[n]} {idx}
                      </span>
                      <button
                        type="button"
                        onClick={() => open(sKey, `依頼者${CIRCLED[n]} ${idx}`, false)}
                        disabled={disabled}
                        className="relative flex h-12 w-full items-start rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs leading-5 text-gray-800 transition hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="line-clamp-1 whitespace-pre-wrap pr-6">
                          {answers[sKey] || <span className="text-gray-400">クリックして入力</span>}
                        </span>
                        <span className="absolute bottom-2 right-2 text-gray-400">
                          <ExpandIcon />
                        </span>
                      </button>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-bold text-gray-600">
                        依頼日{CIRCLED[n]} {idx}
                      </span>
                      <input
                        type="date"
                        value={answers[dKey] ?? ""}
                        onChange={(e) => onChange(dKey, e.target.value)}
                        disabled={disabled}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-2 text-center text-sm font-bold text-gray-400">↓↓</div>

              <div className="mb-3 border-y border-dashed border-gray-300 py-1 text-center text-xs font-black text-gray-700">
                支援内容
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold text-gray-600">支援内容 {n}</span>
                <button
                  type="button"
                  onClick={() => open(supportContentKey, `支援内容 ${n}`, false)}
                  disabled={disabled}
                  className="relative flex h-24 w-full items-start rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs leading-5 text-gray-800 transition hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="line-clamp-3 whitespace-pre-wrap pr-6">
                    {answers[supportContentKey] || <span className="text-gray-400">クリックして入力</span>}
                  </span>
                  <span className="absolute bottom-2 right-2 text-gray-400">
                    <ExpandIcon />
                  </span>
                </button>
              </div>

              <div className="mt-2 text-center text-sm font-bold text-gray-400">↓↓</div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <p className="text-base font-black text-gray-900">{editing.label}</p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="閉じる"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                disabled={disabled}
                inputMode={editing.numeric ? "decimal" : "text"}
                placeholder={editing.numeric ? "数字のみ入力してください。" : "ここに入力してください。"}
                className="h-[45vh] w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={keepOpen}
                  onChange={(e) => setKeepOpen(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                開いたままにする
              </label>
              <div className="flex items-center gap-3">
                {savedFlash && <span className="text-xs font-bold text-emerald-600">保存しました</span>}
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  閉じる
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={disabled}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
