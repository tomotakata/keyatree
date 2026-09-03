"use client";

/**
 * 「会社から求められている能力項目」の評価グリッド。
 * 選択した能力項目①〜⑤について、自己評価／一次評価／二次評価を 0〜10 で選択する。
 * 値は answers に文字列で保存する（キー: q_self_N / q_first_N / q_second_N, N=1..5）。
 */

const SCORES = Array.from({ length: 11 }, (_, i) => String(i)); // 0〜10
const ITEMS = [1, 2, 3, 4, 5];
const CIRCLED: Record<number, string> = { 1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤" };

const COLUMNS: { prefix: string; label: string }[] = [
  { prefix: "q_self", label: "自己評価" },
  { prefix: "q_first", label: "一次評価" },
  { prefix: "q_second", label: "二次評価" },
];

export default function QualitativeEvaluationGrid({
  answers,
  onChange,
  disabled = false,
}: {
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-4">
        <p className="text-base font-black text-gray-900">会社から求められている能力項目</p>
        <p className="mt-0.5 text-xs font-bold text-gray-500">
          選択した能力項目①〜⑤について、自己評価・一次評価・二次評価を 0〜10 で入力してください。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5">
        {ITEMS.map((n) => (
          <div key={n} className="rounded-2xl border border-gray-200 p-4">
            <p className="mb-3 text-sm font-black text-gray-900">能力項目{CIRCLED[n]}</p>
            <div className="space-y-3">
              {COLUMNS.map((col) => {
                const key = `${col.prefix}_${n}`;
                return (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-bold text-gray-600">
                      {col.label}
                      {CIRCLED[n]}
                    </span>
                    <select
                      value={answers[key] ?? "0"}
                      onChange={(e) => onChange(key, e.target.value)}
                      disabled={disabled}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      {SCORES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
