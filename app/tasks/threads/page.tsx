"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllTasks, seedTasks, STATUS_CONFIG, PRIORITY_CONFIG, type FullTask, type TaskMessage } from "@/lib/taskStore";

function fmtDT(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

type ThreadItem = {
  task: FullTask;
  root: TaskMessage;
  replyCount: number;
  lastAt: string;
};

export default function ThreadListPage() {
  const [tasks, setTasks] = useState<FullTask[]>([]);
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "personal" | "org">("all");

  useEffect(() => {
    seedTasks();
    setTasks(getAllTasks());
  }, []);

  /* 全タスクからスレッド（rootメッセージ）を抽出 */
  const allThreads = useMemo<ThreadItem[]>(() => {
    const items: ThreadItem[] = [];
    for (const task of tasks) {
      const rootMsgs = task.messages.filter(m => !m.replyToId && m.senderId !== "system");
      for (const root of rootMsgs) {
        const replies = task.messages.filter(m => m.replyToId === root.id);
        const allTimes = [root.sentAt, ...replies.map(r => r.sentAt)];
        const lastAt = allTimes.sort().at(-1) ?? root.sentAt;
        items.push({ task, root, replyCount: replies.length, lastAt });
      }
    }
    return items.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [tasks]);

  const filtered = useMemo(() => {
    return allThreads.filter(item => {
      if (taskFilter !== "all" && item.task.type !== taskFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.root.text.toLowerCase().includes(q) ||
          (item.root.subject || "").toLowerCase().includes(q) ||
          item.root.senderName.toLowerCase().includes(q) ||
          item.task.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allThreads, search, taskFilter]);

  const totalReplies = filtered.reduce((s, i) => s + i.replyCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <Link href="/tasks" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">タスク管理</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">スレッド一覧</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{filtered.length}件のスレッド / {totalReplies}件の返信</span>
            <Link href="/tasks/new" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
              + 新規タスク
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* 検索 + フィルター */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="6"/><path d="M15 15l-3-3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="件名・本文・送信者・タスク名で検索..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">×</button>
            )}
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            {(["all", "personal", "org"] as const).map(t => {
              const labels = { all: "すべて", personal: "個人", org: "組織" };
              return (
                <button key={t} onClick={() => setTaskFilter(t)}
                  className={`px-3 py-2 text-xs font-semibold transition ${taskFilter === t ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* スレッド一覧 */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base font-bold">スレッドが見つかりません</p>
            <p className="text-sm mt-1">タスクスペースでメッセージを送るとスレッドが作成されます</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => {
              const cfg = STATUS_CONFIG[item.task.status];
              const pri = PRIORITY_CONFIG[item.task.priority];
              return (
                <Link
                  key={`${item.task.id}-${item.root.id}`}
                  href={`/tasks/${item.task.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 px-4 py-4 hover:shadow-md hover:border-emerald-200 transition group"
                >
                  <div className="flex items-start gap-3">
                    {/* 送信者アバター */}
                    <div className="w-9 h-9 rounded-full bg-indigo-400 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      {item.root.senderName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 件名 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition truncate">
                          {item.root.subject || "（件名なし）"}
                        </span>
                        {item.replyCount > 0 && (
                          <span className="flex-shrink-0 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            返信 {item.replyCount}件
                          </span>
                        )}
                      </div>
                      {/* 本文プレビュー */}
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.root.text}</p>
                      {/* メタ情報 */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* タスク名 */}
                        <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          {item.task.title}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${pri.color}`}>{pri.label}優先</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.task.type === "personal" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                          {item.task.type === "personal" ? "個人" : "組織"}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{item.root.senderName} · {fmtDT(item.lastAt)}</span>
                      </div>
                    </div>

                    <span className="text-gray-300 group-hover:text-emerald-500 transition text-sm flex-shrink-0 self-center">›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
