"use client";

import { useState } from "react";

export type TaskStatus = "overdue" | "today" | "soon" | "normal" | "done";

export type Task = {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  assignee?: string;
  category: string;
  relatedMembers?: string[];
};

export const myTasksInitial: Task[] = [
  { id: "t1", title: "山田様 物件案内資料の作成", dueDate: "2025-05-10", status: "today", category: "営業", relatedMembers: ["田中 部長", "佐藤 次郎"] },
  { id: "t2", title: "Q2営業報告書の提出", dueDate: "2025-05-10", status: "today", category: "報告", relatedMembers: ["田中 部長"] },
  { id: "t3", title: "新規顧客フォローアップメール送付", dueDate: "2025-05-10", status: "today", category: "営業", relatedMembers: [] },
  { id: "t4", title: "社内研修レポート提出", dueDate: "2025-05-10", status: "today", category: "研修", relatedMembers: ["山本 三郎"] },
  { id: "t5", title: "契約書類の最終確認・押印", dueDate: "2025-05-10", status: "today", category: "契約", relatedMembers: ["田中 部長", "田中 花子"] },
];

export const teamTasks: Task[] = [
  { id: "o1", title: "下半期予算計画書の承認", dueDate: "2025-05-08", status: "overdue", assignee: "田中 部長", category: "管理" },
  { id: "o2", title: "顧客アンケート集計", dueDate: "2025-05-09", status: "overdue", assignee: "佐藤 次郎", category: "営業" },
  { id: "o3", title: "物件写真の差し替え対応", dueDate: "2025-05-10", status: "today", assignee: "山本 三郎", category: "物件管理" },
  { id: "o4", title: "新規顧客ヒアリングシート作成", dueDate: "2025-05-12", status: "soon", assignee: "田中 花子", category: "営業" },
  { id: "o5", title: "月次売上レポート提出", dueDate: "2025-05-13", status: "soon", assignee: "佐藤 次郎", category: "報告" },
];

const statusConfig: Record<TaskStatus, { label: string; bg: string; border: string; badge: string; dot: string }> = {
  overdue: { label: "期日超過", bg: "bg-rose-50",   border: "border-rose-200",  badge: "bg-rose-500 text-white",  dot: "bg-rose-500" },
  today:   { label: "本日締切", bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-500 text-white", dot: "bg-amber-500" },
  soon:    { label: "期日間近", bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-400 text-white",  dot: "bg-blue-400" },
  normal:  { label: "通常",     bg: "bg-gray-50",   border: "border-gray-200",  badge: "bg-gray-400 text-white",  dot: "bg-gray-400" },
  done:    { label: "完了",     bg: "bg-emerald-50",border: "border-emerald-200",badge: "bg-emerald-500 text-white",dot: "bg-emerald-400" },
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "normal",  label: "通常" },
  { value: "soon",    label: "期日間近" },
  { value: "today",   label: "本日締切" },
  { value: "overdue", label: "期日超過" },
  { value: "done",    label: "完了" },
];

// ---- 完了報告モーダル ----
function CompleteModal({ task, onClose, onSubmit }: {
  task: Task;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-800 mb-1">完了報告</h3>
        <p className="text-sm text-gray-500 mb-4 truncate">{task.title}</p>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="完了内容・備考を入力（任意）"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 text-sm border border-gray-200 rounded-lg py-2 text-gray-500 hover:bg-gray-50">
            キャンセル
          </button>
          <button
            onClick={() => onSubmit(comment)}
            className="flex-1 text-sm bg-emerald-500 text-white rounded-lg py-2 font-bold hover:bg-emerald-600"
          >
            完了として報告する
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 期日変更依頼モーダル ----
function DeadlineModal({ task, onClose, onSubmit }: {
  task: Task;
  onClose: () => void;
  onSubmit: (newDate: string, reason: string) => void;
}) {
  const [newDate, setNewDate] = useState(task.dueDate);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const members = task.relatedMembers ?? [];

  const handleSubmit = () => {
    if (!confirmed) { setConfirmed(true); return; }
    onSubmit(newDate, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-800 mb-1">期日変更依頼</h3>
        <p className="text-sm text-gray-500 mb-4 truncate">{task.title}</p>

        <label className="block text-xs font-semibold text-gray-500 mb-1">変更後の期日</label>
        <input
          type="date"
          value={newDate}
          onChange={(e) => { setNewDate(e.target.value); setConfirmed(false); }}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />

        <label className="block text-xs font-semibold text-gray-500 mb-1">変更理由</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="変更理由を入力してください"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />

        {/* 警告 */}
        {members.length > 0 && (
          <div className={`rounded-lg px-4 py-3 mb-4 border text-sm ${confirmed ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
            <p className="font-bold mb-1">{confirmed ? "本当に申請しますか？" : "通知に関するご確認"}</p>
            <p className="text-xs leading-relaxed">
              この変更を申請すると、関係メンバー（
              <span className="font-semibold">{members.join("・")}</span>
              ）に通知が送信されます。
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm border border-gray-200 rounded-lg py-2 text-gray-500 hover:bg-gray-50">
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || !newDate}
            className={`flex-1 text-sm rounded-lg py-2 font-bold transition ${
              confirmed
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {confirmed ? "申請を確定する" : members.length > 0 ? "内容を確認する" : "申請する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 個人タスク行 ----
function MyTaskRow({ task, onStatusChange, onComplete, onDeadlineRequest }: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onComplete: (id: string) => void;
  onDeadlineRequest: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[task.status];
  const isDone = task.status === "done";

  return (
    <div className={`rounded-lg border transition-all ${cfg.bg} ${cfg.border} ${isDone ? "opacity-60" : ""}`}>
      {/* メイン行 */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{task.dueDate}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{task.category}</span>
          {!isDone && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-400 hover:text-emerald-600 font-medium px-1 transition"
            >
              {expanded ? "閉じる" : "操作"}
            </button>
          )}
        </div>
      </div>

      {/* アクションパネル */}
      {expanded && !isDone && (
        <div className="border-t border-dashed border-gray-200 px-4 py-3 bg-white/70 flex flex-wrap gap-3 items-center">
          {/* ステータス変更 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">ステータス変更：</span>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <span className="w-px h-4 bg-gray-200" />

          {/* 完了報告 */}
          <button
            onClick={() => onComplete(task.id)}
            className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-600 transition"
          >
            完了報告
          </button>

          {/* 期日変更依頼 */}
          <button
            onClick={() => onDeadlineRequest(task.id)}
            className="text-xs bg-white border border-amber-400 text-amber-600 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-50 transition"
          >
            期日変更依頼
          </button>
        </div>
      )}
    </div>
  );
}

// ---- 組織タスク行 ----
function TeamTaskRow({ task }: { task: Task }) {
  const cfg = statusConfig[task.status];
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 font-medium truncate">{task.title}</p>
        {task.assignee && <p className="text-xs text-gray-400 mt-0.5">{task.assignee}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400">{task.dueDate}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{task.category}</span>
      </div>
    </div>
  );
}

// ---- メインパネル ----
export default function TaskAlertPanel() {
  const [myTasks, setMyTasks] = useState(myTasksInitial);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showTeamTasks, setShowTeamTasks] = useState(false);

  const [completeTarget, setCompleteTarget] = useState<string | null>(null);
  const [deadlineTarget, setDeadlineTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setMyTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const handleComplete = (comment: string) => {
    if (!completeTarget) return;
    setMyTasks((prev) => prev.map((t) => t.id === completeTarget ? { ...t, status: "done" } : t));
    setCompleteTarget(null);
    showToast("完了報告を送信しました");
  };

  const handleDeadlineSubmit = (newDate: string, reason: string) => {
    if (!deadlineTarget) return;
    setMyTasks((prev) => prev.map((t) => t.id === deadlineTarget ? { ...t, dueDate: newDate, status: "normal" } : t));
    setDeadlineTarget(null);
    showToast("期日変更依頼を申請しました。関係メンバーに通知を送信しました。");
  };

  const activeTasks = myTasks.filter((t) => t.status !== "done");
  const todayCount = myTasks.filter((t) => t.status === "today" || t.status === "overdue").length;
  const overdueTeam = teamTasks.filter((t) => t.status === "overdue").length;
  const todayTeam   = teamTasks.filter((t) => t.status === "today").length;
  const soonTeam    = teamTasks.filter((t) => t.status === "soon").length;

  const completeTask = myTasks.find((t) => t.id === completeTarget) ?? null;
  const deadlineTask = myTasks.find((t) => t.id === deadlineTarget) ?? null;

  return (
    <>
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
            <button onClick={() => setShowMyTasks(!showMyTasks)} className="text-xs text-emerald-600 font-semibold hover:underline">
              {showMyTasks ? "閉じる" : "詳細表示"}
            </button>
          </div>
          {showMyTasks && (
            <div className="p-3 space-y-2">
              {myTasks.map((t) => (
                <MyTaskRow
                  key={t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onComplete={(id) => setCompleteTarget(id)}
                  onDeadlineRequest={(id) => setDeadlineTarget(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 組織タスク */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-gray-500 tracking-wide uppercase">組織タスク</span>
              <span className="w-px h-3 bg-gray-300" />
              {overdueTeam > 0 && <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">期日超過 {overdueTeam}件</span>}
              {todayTeam  > 0 && <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">本日締切 {todayTeam}件</span>}
              {soonTeam   > 0 && <span className="text-xs font-bold bg-blue-400 text-white px-2 py-0.5 rounded-full">期日間近 {soonTeam}件</span>}
            </div>
            <button onClick={() => setShowTeamTasks(!showTeamTasks)} className="text-xs text-emerald-600 font-semibold hover:underline">
              {showTeamTasks ? "閉じる" : "詳細表示"}
            </button>
          </div>
          {showTeamTasks && (
            <div className="p-3 space-y-2">
              {teamTasks.map((t) => <TeamTaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>
      </div>

      {/* モーダル */}
      {completeTask && (
        <CompleteModal task={completeTask} onClose={() => setCompleteTarget(null)} onSubmit={handleComplete} />
      )}
      {deadlineTask && (
        <DeadlineModal task={deadlineTask} onClose={() => setDeadlineTarget(null)} onSubmit={handleDeadlineSubmit} />
      )}

      {/* トースト通知 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </>
  );
}
