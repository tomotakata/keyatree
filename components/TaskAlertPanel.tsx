"use client";

import { useState } from "react";

export type Task = {
  id: string;
  title: string;
  dueDate: string;
  status: "overdue" | "today" | "soon" | "normal";
  assignee?: string;
  category: string;
};

export const myTasks: Task[] = [
  { id: "t1", title: "山田様 物件案内資料の作成", dueDate: "2025-05-10", status: "today", category: "営業" },
  { id: "t2", title: "Q2営業報告書の提出", dueDate: "2025-05-10", status: "today", category: "報告" },
  { id: "t3", title: "新規顧客フォローアップメール送付", dueDate: "2025-05-10", status: "today", category: "営業" },
  { id: "t4", title: "社内研修レポート提出", dueDate: "2025-05-10", status: "today", category: "研修" },
  { id: "t5", title: "契約書類の最終確認・押印", dueDate: "2025-05-10", status: "today", category: "契約" },
];

export const teamTasks: Task[] = [
  { id: "o1", title: "田中部長：下半期予算計画書の承認", dueDate: "2025-05-08", status: "overdue", assignee: "田中 部長", category: "管理" },
  { id: "o2", title: "佐藤次郎：顧客アンケート集計", dueDate: "2025-05-09", status: "overdue", assignee: "佐藤 次郎", category: "営業" },
  { id: "o3", title: "山本三郎：物件写真の差し替え対応", dueDate: "2025-05-10", status: "today", assignee: "山本 三郎", category: "物件管理" },
  { id: "o4", title: "田中花子：新規顧客ヒアリングシート作成", dueDate: "2025-05-12", status: "soon", assignee: "田中 花子", category: "営業" },
  { id: "o5", title: "佐藤次郎：月次売上レポート提出", dueDate: "2025-05-13", status: "soon", assignee: "佐藤 次郎", category: "報告" },
];

const statusConfig = {
  overdue: { label: "期日超過", bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-500 text-white", dot: "bg-rose-500" },
  today:   { label: "本日締切", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-500 text-white", dot: "bg-amber-500" },
  soon:    { label: "期日間近", bg: "bg-blue-50",  border: "border-blue-200",  badge: "bg-blue-400 text-white",  dot: "bg-blue-400" },
  normal:  { label: "通常",     bg: "bg-gray-50",  border: "border-gray-200",  badge: "bg-gray-400 text-white",  dot: "bg-gray-400" },
};

function TaskRow({ task, showAssignee = false }: { task: Task; showAssignee?: boolean }) {
  const cfg = statusConfig[task.status];
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 font-medium truncate">{task.title}</p>
        {showAssignee && task.assignee && (
          <p className="text-xs text-gray-400 mt-0.5">{task.assignee}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400">{task.dueDate}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
          {task.category}
        </span>
      </div>
    </div>
  );
}

export default function TaskAlertPanel() {
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showTeamTasks, setShowTeamTasks] = useState(false);

  const todayCount = myTasks.filter((t) => t.status === "today" || t.status === "overdue").length;
  const overdueTeam = teamTasks.filter((t) => t.status === "overdue").length;
  const todayTeam   = teamTasks.filter((t) => t.status === "today").length;
  const soonTeam    = teamTasks.filter((t) => t.status === "soon").length;

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-3 py-4">

      {/* 個人タスク */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-500 tracking-wide uppercase">個人タスク</span>
            <span className="w-px h-3 bg-gray-300" />
            <span className="text-sm font-bold text-amber-600">
              本日締め切りタスクが{todayCount}件あります
            </span>
          </div>
          <button
            onClick={() => setShowMyTasks(!showMyTasks)}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            {showMyTasks ? "閉じる" : "詳細表示"}
          </button>
        </div>

        {showMyTasks && (
          <div className="p-3 space-y-2">
            {myTasks.map((t) => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
      </div>

      {/* 組織タスク */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-gray-500 tracking-wide uppercase">組織タスク</span>
            <span className="w-px h-3 bg-gray-300" />
            {overdueTeam > 0 && (
              <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                期日超過 {overdueTeam}件
              </span>
            )}
            {todayTeam > 0 && (
              <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                本日締切 {todayTeam}件
              </span>
            )}
            {soonTeam > 0 && (
              <span className="text-xs font-bold bg-blue-400 text-white px-2 py-0.5 rounded-full">
                期日間近 {soonTeam}件
              </span>
            )}
          </div>
          <button
            onClick={() => setShowTeamTasks(!showTeamTasks)}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            {showTeamTasks ? "閉じる" : "詳細表示"}
          </button>
        </div>

        {showTeamTasks && (
          <div className="p-3 space-y-2">
            {teamTasks.map((t) => <TaskRow key={t.id} task={t} showAssignee />)}
          </div>
        )}
      </div>

    </div>
  );
}
