"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTask, CATEGORIES, MOCK_EMPLOYEES, type TaskType, type TaskPriority } from "@/lib/taskStore";

export default function NewTaskPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("営業");
  const [type, setType] = useState<TaskType>("personal");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["001"]);
  const [saving, setSaving] = useState(false);

  const toggleMember = (id: string) => {
    if (id === "001") return; // owner cannot be removed
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !deadline) return;
    setSaving(true);

    const members = selectedMembers.map((id) => {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === id)!;
      return {
        id: emp.id,
        name: emp.name,
        role: id === "001" ? ("owner" as const) : ("assignee" as const),
        joinedAt: new Date().toISOString(),
      };
    });

    const task = createTask({
      title: title.trim(),
      description: description.trim(),
      deadline,
      category,
      type,
      priority,
      status: "not_started",
      ownerId: "001",
      ownerName: "鈴木 一郎",
      members,
    });

    setTimeout(() => {
      router.push(`/tasks/${task.id}`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <Link href="/tasks" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">タスク管理</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">新規タスク作成</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
          <h1 className="text-base font-bold text-gray-800">新規タスクを作成</h1>

          {/* タイトル */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">タスク名 <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：山田様 物件案内資料の作成"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">詳細・説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="タスクの詳細内容を入力"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 期日 */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">期日 <span className="text-rose-400">*</span></label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* タイプ */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">タスク種別</label>
              <div className="flex gap-2">
                {(["personal", "org"] as TaskType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${type === t ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                  >
                    {t === "personal" ? "個人" : "組織"}
                  </button>
                ))}
              </div>
            </div>

            {/* 優先度 */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">優先度</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as TaskPriority[]).map((p) => {
                  const labels = { high: "高", medium: "中", low: "低" };
                  const colors = { high: "bg-rose-500 text-white border-rose-500", medium: "bg-amber-500 text-white border-amber-500", low: "bg-gray-400 text-white border-gray-400" };
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${priority === p ? colors[p] : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* メンバー招待 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">メンバーを招待</label>
            <div className="space-y-2">
              {MOCK_EMPLOYEES.map((emp) => {
                const selected = selectedMembers.includes(emp.id);
                const isOwner = emp.id === "001";
                return (
                  <button
                    key={emp.id}
                    onClick={() => toggleMember(emp.id)}
                    disabled={isOwner}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${selected ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:bg-gray-50"} ${isOwner ? "opacity-70 cursor-default" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.department}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                      {selected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    {isOwner && <span className="text-xs text-emerald-600 font-bold ml-1">オーナー</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex gap-3 pt-2">
            <Link href="/tasks" className="flex-1 text-sm border border-gray-200 rounded-xl py-3 text-gray-500 font-medium text-center hover:bg-gray-50 transition">
              キャンセル
            </Link>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !deadline || saving}
              className="flex-1 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl py-3 transition"
            >
              {saving ? "作成中..." : "タスクを作成する"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
