"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllTasks, seedTasks, getCategories, formatDeadline,
  STATUS_CONFIG, PRIORITY_CONFIG,
  type FullTask, type TaskStatus, type TaskType,
} from "@/lib/taskStore";

function TaskCard({ task }: { task: FullTask }) {
  const cfg = STATUS_CONFIG[task.status];
  const pri = PRIORITY_CONFIG[task.priority];
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 px-4 py-3 transition group"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate text-zinc-100 group-hover:text-white transition ${task.status === "completed" ? "line-through text-zinc-500" : ""}`}>
              {task.title}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{task.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pri.color}`}>{pri.label}優先</span>
              <span className="text-xs text-zinc-300 bg-zinc-700/60 border border-zinc-700 px-2 py-0.5 rounded-full">{task.category}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.type === "personal" ? "bg-indigo-500/20 text-indigo-300" : "bg-teal-500/20 text-teal-300"}`}>
                {task.type === "personal" ? "個人" : "組織"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pl-5 sm:pl-0">
          <span className="text-xs text-zinc-500">期日 {formatDeadline(task.deadline)}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          <div className="flex -space-x-1">
            {task.members.slice(0, 3).map((m) => (
              <div key={m.id} className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                {m.name.charAt(0)}
              </div>
            ))}
            {task.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-zinc-300 text-xs font-bold">
                +{task.members.length - 3}
              </div>
            )}
          </div>
          <span className="text-zinc-600 group-hover:text-emerald-400 transition">›</span>
        </div>
      </div>
    </Link>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<FullTask[]>([]);
  const [tab, setTab] = useState<"all" | TaskType>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    seedTasks();
    setTasks(getAllTasks());
    fetch("/api/task-channels")
      .then((r) => r.json())
      .then((d) => {
        const names = (d?.channels ?? []).map((c: { name: string }) => c.name);
        if (Array.isArray(names) && names.length > 0) setCategories(names);
        else setCategories(getCategories());
      })
      .catch(() => setCategories(getCategories()));
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

  const statusChips: { key: TaskStatus; label: string; active: string }[] = [
    { key: "overdue", label: "期日超過", active: "bg-rose-500 text-white border-rose-500" },
    { key: "in_progress", label: "進行中", active: "bg-blue-500 text-white border-blue-500" },
    { key: "not_started", label: "未着手", active: "bg-zinc-500 text-white border-zinc-500" },
    { key: "completed", label: "完了済み", active: "bg-emerald-500 text-white border-emerald-500" },
  ];

  const headTitle =
    categoryFilter !== "all" ? categoryFilter : tab === "personal" ? "個人タスク" : tab === "org" ? "組織タスク" : "すべてのタスク";

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-200">
      {/* 上部バー */}
      <header className="h-12 flex items-center gap-3 px-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <Link href="/employees/001" className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 transition">
          <span className="text-base leading-none">‹</span> マイページ
        </Link>
        <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center ml-2">
          <span className="text-white text-[11px] font-bold">K</span>
        </div>
        <span className="text-sm font-bold text-white">タスク管理</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/features" className="text-zinc-400 hover:text-white text-xs transition">機能一覧</Link>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* 左サイドバー */}
        <aside className="w-72 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col min-h-0">
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">タスク</h2>
            <Link
              href="/tasks/new"
              title="新規タスク"
              className="w-7 h-7 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-lg leading-none flex items-center justify-center transition"
            >
              +
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
            {/* 種別 */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">種別</p>
              <div className="space-y-0.5">
                {(["all", "personal", "org"] as const).map((t) => {
                  const labels = { all: "すべて", personal: "個人タスク", org: "組織タスク" };
                  const active = tab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition ${
                        active ? "bg-zinc-800 text-white font-semibold" : "text-zinc-300 hover:bg-zinc-800/60"
                      }`}
                    >
                      <span>{labels[t]}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${active ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
                        {counts[t]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ステータス */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">ステータス</p>
              <div className="flex flex-wrap gap-1.5">
                {statusChips.map((s) => {
                  const count = statusCounts[s.key];
                  const active = statusFilter === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStatusFilter(active ? "all" : s.key)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                        active ? s.active : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                      }`}
                    >
                      {s.label} {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* チャンネル */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">チャンネル</p>
                <Link href="/tasks/channels" className="text-[11px] text-emerald-400 hover:text-emerald-300 transition">管理</Link>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`w-full text-left rounded-lg px-3 py-1.5 text-sm transition ${
                    categoryFilter === "all" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-300 hover:bg-zinc-800/60"
                  }`}
                >
                  すべて
                </button>
                {categories.map((c) => {
                  const active = categoryFilter === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(active ? "all" : c)}
                      className={`w-full flex items-center gap-2 text-left rounded-lg px-3 py-1.5 text-sm transition ${
                        active ? "bg-emerald-600/20 text-white font-semibold" : "text-zinc-300 hover:bg-zinc-800/60"
                      }`}
                    >
                      <span className="text-zinc-500">#</span>
                      <span className="truncate">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* フッターリンク */}
          <div className="px-3 py-3 border-t border-zinc-800 flex flex-col gap-1">
            <Link href="/tasks/archive" className="text-xs text-zinc-400 hover:text-white rounded-lg px-3 py-1.5 hover:bg-zinc-800/60 transition">アーカイブ</Link>
            <Link href="/tasks/threads" className="text-xs text-zinc-400 hover:text-white rounded-lg px-3 py-1.5 hover:bg-zinc-800/60 transition">スレッド一覧</Link>
          </div>
        </aside>

        {/* 右メインペイン */}
        <main className="flex-1 min-w-0 bg-zinc-900 flex flex-col min-h-0">
          <div className="flex-shrink-0 border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white truncate">{headTitle}</h1>
              <p className="text-[11px] text-zinc-500">{filtered.length}件のタスク</p>
            </div>
            <div className="flex items-center gap-2">
              {(statusFilter !== "all" || categoryFilter !== "all") && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 transition"
                >
                  フィルター解除
                </button>
              )}
              <Link href="/tasks/new" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition">
                + 新規タスク
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="max-w-3xl mx-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <p className="text-base font-bold">タスクがありません</p>
                  <p className="text-sm mt-1">「+ 新規タスク」から作成してください</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((t) => <TaskCard key={t.id} task={t} />)}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
