"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  formatDeadline,
  STATUS_CONFIG, PRIORITY_CONFIG,
  type FullTask,
} from "@/lib/taskStore";
import { apiListTasks, apiRestoreTask, apiDeleteTask } from "@/lib/taskClient";

function fmtDT(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ArchivedCard({
  task, onRestore, onDelete, onView,
}: {
  task: FullTask;
  onRestore: (t: FullTask) => void;
  onDelete: (t: FullTask) => void;
  onView: (t: FullTask) => void;
}) {
  const cfg = STATUS_CONFIG[task.status];
  const pri = PRIORITY_CONFIG[task.priority];
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:shadow-md transition">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-700">{task.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pri.color}`}>{pri.label}優先</span>
              <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">{task.category}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.type === "personal" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                {task.type === "personal" ? "個人" : "組織"}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-400">
              <span>期日 {formatDeadline(task.deadline)}</span>
              <span>アーカイブ日時 {fmtDT(task.archivedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pl-5 sm:pl-0">
          <button onClick={() => onView(task)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
            閲覧
          </button>
          <button onClick={() => onRestore(task)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">
            復旧
          </button>
          <button onClick={() => onDelete(task)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition">
            完全削除
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<FullTask[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    apiListTasks({ archived: true }).then(setTasks).catch(() => setTasks([]));
  }, []);

  const reload = () => apiListTasks({ archived: true }).then(setTasks).catch(() => {});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRestore = async (task: FullTask) => {
    await apiRestoreTask(task.id);
    await reload();
    showToast(`「${task.title}」を復旧しました`);
  };

  const handleDelete = async (task: FullTask) => {
    if (!confirm(`「${task.title}」を完全に削除しますか？この操作は取り消せません。`)) return;
    await apiDeleteTask(task.id);
    await reload();
    showToast("タスクを完全に削除しました");
  };

  const handleView = (task: FullTask) => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-gray-800">アーカイブ済みタスク</h1>
          {tasks.length > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{tasks.length}件</span>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base font-bold">アーカイブされたタスクはありません</p>
            <p className="text-sm mt-1">タスク詳細画面から「アーカイブに移動」するとここに表示されます</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <ArchivedCard key={t.id} task={t} onRestore={handleRestore} onDelete={handleDelete} onView={handleView} />
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
