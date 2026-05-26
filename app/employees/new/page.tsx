"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const departments = ["営業部 > 第一営業課", "営業部 > 第二営業課", "管理部 > 総務課", "物件管理部 > 物件課", "経営管理部"];
const positions = ["代表取締役", "部長", "課長", "主任", "担当者"];
const grades = ["E1", "E2", "J1", "J2", "J3", "S1", "S2", "S3", "M1", "M2", "M3"];
const jobTypes = ["営業", "管理", "物件管理", "経営", "経理", "マーケティング"];
const employmentTypes = ["正社員", "契約社員", "パートタイム", "アルバイト"];
const enneagramTypes = [
  { type: 1, label: "改革者" }, { type: 2, label: "援助者" }, { type: 3, label: "達成者" },
  { type: 4, label: "個人主義者" }, { type: 5, label: "研究者" }, { type: 6, label: "忠実者" },
  { type: 7, label: "熱中者" }, { type: 8, label: "挑戦者" }, { type: 9, label: "平和主義者" },
];

type FormData = {
  name: string; nameKana: string; department: string; position: string;
  grade: string; jobType: string; employmentType: string; joinedAt: string;
  enneagramType: string; bio: string;
};

const initial: FormData = {
  name: "", nameKana: "", department: departments[0], position: positions[4],
  grade: grades[2], jobType: jobTypes[0], employmentType: employmentTypes[0],
  joinedAt: new Date().toISOString().slice(0, 10), enneagramType: "3", bio: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white";

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const err: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) err.name = "氏名を入力してください";
    if (!form.nameKana.trim()) err.nameKana = "フリガナを入力してください";
    if (!form.joinedAt) err.joinedAt = "入社日を入力してください";
    return err;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border p-10 text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-500 text-3xl font-bold">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">登録が完了しました</h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-bold text-gray-700">{form.name}</span> さんの従業員情報を登録しました。
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/employees"
              className="w-full text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition text-center"
            >
              従業員一覧へ戻る
            </Link>
            <button
              onClick={() => { setForm(initial); setSubmitted(false); }}
              className="w-full text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition"
            >
              続けて登録する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm">KeyaTree</Link>
          <span className="text-gray-300 mx-1">›</span>
          <Link href="/employees" className="text-gray-500 text-sm hover:text-emerald-600 transition">従業員一覧</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">新規登録</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">従業員 新規登録</h1>
          <p className="text-sm text-gray-500 mt-1">新しい従業員の基本情報を入力してください。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 border-b pb-2">基本情報</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="氏名" required>
                <input
                  type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="例：鈴木 一郎" className={inputCls}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </Field>
              <Field label="フリガナ" required>
                <input
                  type="text" value={form.nameKana} onChange={(e) => set("nameKana", e.target.value)}
                  placeholder="例：スズキ イチロウ" className={inputCls}
                />
                {errors.nameKana && <p className="text-xs text-rose-500 mt-1">{errors.nameKana}</p>}
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="入社日" required>
                <input
                  type="date" value={form.joinedAt} onChange={(e) => set("joinedAt", e.target.value)}
                  className={inputCls}
                />
                {errors.joinedAt && <p className="text-xs text-rose-500 mt-1">{errors.joinedAt}</p>}
              </Field>
              <Field label="雇用形態">
                <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={inputCls}>
                  {employmentTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* 所属・役職 */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 border-b pb-2">所属・役職</h2>

            <Field label="部署">
              <select value={form.department} onChange={(e) => set("department", e.target.value)} className={inputCls}>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="役職">
                <select value={form.position} onChange={(e) => set("position", e.target.value)} className={inputCls}>
                  {positions.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="等級">
                <select value={form.grade} onChange={(e) => set("grade", e.target.value)} className={inputCls}>
                  {grades.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="職種">
                <select value={form.jobType} onChange={(e) => set("jobType", e.target.value)} className={inputCls}>
                  {jobTypes.map((j) => <option key={j}>{j}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* パーソナリティ */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 border-b pb-2">パーソナリティ</h2>

            <Field label="エニアグラムタイプ">
              <select value={form.enneagramType} onChange={(e) => set("enneagramType", e.target.value)} className={inputCls}>
                {enneagramTypes.map((et) => (
                  <option key={et.type} value={String(et.type)}>
                    Type {et.type}・{et.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="自己紹介・一言コメント">
              <textarea
                value={form.bio} onChange={(e) => set("bio", e.target.value)}
                rows={3} placeholder="例：お客様に寄り添った提案を心がけています。"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <Link
              href="/employees"
              className="flex-1 text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-xl transition text-center"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="flex-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
            >
              登録する
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
