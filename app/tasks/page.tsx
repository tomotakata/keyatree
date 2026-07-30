"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import {
  getAllTasks, seedTasks, getCategories, saveCategories, formatDeadline,
  STATUS_CONFIG, PRIORITY_CONFIG,
  type FullTask, type TaskStatus, type TaskType,
} from "@/lib/taskStore";

function TaskCard({ task }: { task: FullTask }) {
  const cfg = STATUS_CONFIG[task.status];
  const pri = PRIORITY_CONFIG[task.priority];
  return (
    <Link href={`/tasks/${task.id}`} className={`block rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 hover:shadow-md transition group`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate text-gray-800 group-hover:text-emerald-700 transition ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
              {task.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pri.color}`}>{pri.label}優先</span>
              <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{task.category}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.type === "personal" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                {task.type === "personal" ? "個人" : "組織"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pl-5 sm:pl-0">
          <span className="text-xs text-gray-400">期日 {formatDeadline(task.deadline)}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          <div className="flex -space-x-1">
            {task.members.slice(0, 3).map((m) => (
              <div key={m.id} className="w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                {m.name.charAt(0)}
              </div>
            ))}
            {task.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-bold">
                +{task.members.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-300 group-hover:text-emerald-500 transition">›</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryModal({
  initial, onSave, onClose,
}: {
  initial: string[];
  onSave: (cats: string[]) => void;
  onClose: () => void;
}) {
  const [cats, setCats] = useState<string[]>(initial);
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v || cats.includes(v)) return;
    setCats([...cats, v]);
    setInput("");
  };
  const rename = (i: number, v: string) => setCats(cats.map((c, idx) => (idx === i ? v : c)));
  const remove = (i: number) => setCats(cats.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">カテゴリの管理</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cats.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={c} onChange={(e) => rename(i, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <button onClick={() => remove(i)}
                  className="text-gray-300 hover:text-rose-500 transition text-sm px-2">削除</button>
              </div>
            ))}
            {cats.length === 0 && <p className="text-xs text-gray-400 text-center py-4">カテゴリがありません</p>}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder="新しいカテゴリ名"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <button onClick={add}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition">追加</button>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">キャンセル</button>
          <button onClick={() => onSave(cats.map((c) => c.trim()).filter((c, i, a) => c && a.indexOf(c) === i))}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition">保存する</button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<FullTask[]>([]);
  const [tab, setTab] = useState<"all" | TaskType>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);

  useEffect(() => {
    seedTasks();
    setTasks(getAllTasks());
    setCategories(getCategories());
  }, []);

  const filtered = tasks.filter((t) => {
    if (tab !== "all" && t.type !== tab) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  const counts = {
    all: tasks.length,
    personal: tasks.filter((t) => t.type === "personal").length,
    org: tasks.filter((t) => t.type === "org").length,
  };

  const statusCounts: Record<string, number> = {
    overdue: tasks.filter((t) => t.status === "overdue").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    not_started: tasks.filter((t) => t.status === "not_started").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <BackButton />
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <Link href="/employees/001" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">タスク管理</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/tasks/archive" className="text-xs text-gray-500 hover:text-emerald-600 border border-gray-200 px-3 py-1.5 rounded-xl transition hover:border-emerald-300">
              アーカイブ
            </Link>
            <Link href="/tasks/threads" className="text-xs text-gray-500 hover:text-emerald-600 border border-gray-200 px-3 py-1.5 rounded-xl transition hover:border-emerald-300">
              スレッド一覧
            </Link>
            <Link href="/tasks/new" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              + 新規タスク
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* サマリーバッジ */}
        <div className="flex flex-wrap gap-2">
          {statusCounts.overdue > 0 && (
            <button onClick={() => setStatusFilter(statusFilter === "overdue" ? "all" : "overdue")}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${statusFilter === "overdue" ? "bg-rose-500 text-white border-rose-500" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"}`}>
              期日超過 {statusCounts.overdue}件
            </button>
          )}
          {statusCounts.in_progress > 0 && (
            <button onClick={() => setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress")}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${statusFilter === "in_progress" ? "bg-blue-500 text-white border-blue-500" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"}`}>
              進行中 {statusCounts.in_progress}件
            </button>
          )}
          {statusCounts.not_started > 0 && (
            <button onClick={() => setStatusFilter(statusFilter === "not_started" ? "all" : "not_started")}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${statusFilter === "not_started" ? "bg-gray-600 text-white border-gray-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
              未着手 {statusCounts.not_started}件
            </button>
          )}
          {statusCounts.completed > 0 && (
            <button onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${statusFilter === "completed" ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"}`}>
              完了済み {statusCounts.completed}件
            </button>
          )}
          {statusFilter !== "all" && (
            <button onClick={() => setStatusFilter("all")} className="text-xs text-gray-400 hover:text-gray-600 px-2 transition">フィルター解除</button>
          )}
        </div>

        {/* タブ */}
        <div className="flex border-b">
          {(["all", "personal", "org"] as const).map((t) => {
            const labels = { all: "すべて", personal: "個人タスク", org: "組織タスク" };
            const c = counts[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${tab === t ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                {labels[t]}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c}</span>
              </button>
            );
          })}
        </div>

        {/* カテゴリー別フィルター */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400">カテゴリ:</span>
          <button onClick={() => setCategoryFilter("all")}
            className={`text-xs font-bold px-3 py-1 rounded-full border transition ${categoryFilter === "all" ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
            すべて
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(categoryFilter === c ? "all" : c)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition ${categoryFilter === c ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
              {c}
            </button>
          ))}
          <button onClick={() => setShowCatModal(true)}
            className="text-xs font-bold px-3 py-1 rounded-full border border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition">
            + カテゴリ管理
          </button>
        </div>

        {/* タスクリスト */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base font-bold">タスクがありません</p>
            <p className="text-sm mt-1">「+ 新規タスク」から作成してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </main>

      {showCatModal && (
        <CategoryModal
          initial={categories}
          onClose={() => setShowCatModal(false)}
          onSave={(cats) => {
            saveCategories(cats);
            setCategories(cats);
            if (categoryFilter !== "all" && !cats.includes(categoryFilter)) setCategoryFilter("all");
            setShowCatModal(false);
          }}
        />
      )}
    </div>
  );
}
