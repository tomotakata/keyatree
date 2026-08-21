"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientSession, sessionMemberId } from "@/lib/clientSession";
import { apiListTasks, apiSetStatus, apiEditTask, apiAddMessage } from "@/lib/taskClient";
import { reminderLevel, buildNotifications, type ReminderLevel, type TaskNotification } from "@/lib/taskReminder";
import { formatDeadline, type FullTask, type TaskStatus } from "@/lib/taskStore";

type LocalTask = {
  id: string;
  title: string;
  dueRaw: string;
  dueLabel: string;
  level: ReminderLevel;
  realStatus: TaskStatus;
  category: string;
  talkName?: string;
  assigneeNames: string[];
  relatedMembers: string[];
};

const statusConfig: Record<ReminderLevel, { label: string; bg: string; border: string; badge: string; dot: string }> = {
  overdue: { label: "期日超過", bg: "bg-rose-50",   border: "border-rose-200",  badge: "bg-rose-500 text-white",  dot: "bg-rose-500" },
  today:   { label: "本日締切", bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-500 text-white", dot: "bg-amber-500" },
  soon:    { label: "期日間近", bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-400 text-white",  dot: "bg-blue-400" },
  normal:  { label: "通常",     bg: "bg-gray-50",   border: "border-gray-200",  badge: "bg-gray-400 text-white",  dot: "bg-gray-400" },
  done:    { label: "完了",     bg: "bg-emerald-50",border: "border-emerald-200",badge: "bg-emerald-500 text-white",dot: "bg-emerald-400" },
};

const realStatusOptions: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "completed",   label: "完了" },
];

function toLocal(t: FullTask): LocalTask {
  const assignees = t.members.filter((m) => m.role !== "owner");
  return {
    id: t.id,
    title: t.title,
    dueRaw: t.deadline || "",
    dueLabel: formatDeadline(t.deadline),
    level: reminderLevel(t),
    realStatus: t.status,
    category: t.category,
    talkName: t.talkName,
    assigneeNames: assignees.map((m) => m.name),
    relatedMembers: t.members.map((m) => m.name),
  };
}

function dateOnly(iso: string) {
  if (!iso) return "";
  return iso.includes("T") ? iso.slice(0, 10) : iso;
}

// ---- 完了報告モーダル ----
function CompleteModal({ task, onClose, onSubmit }: {
  task: LocalTask;
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
  task: LocalTask;
  onClose: () => void;
  onSubmit: (newDate: string, reason: string) => void;
}) {
  const [newDate, setNewDate] = useState(dateOnly(task.dueRaw));
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
  task: LocalTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onComplete: (id: string) => void;
  onDeadlineRequest: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[task.level];
  const isDone = task.realStatus === "completed";

  return (
    <div className={`rounded-lg border transition-all ${cfg.bg} ${cfg.border} ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0 hover:underline">
          <p className={`text-sm font-medium truncate ${isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
            {task.title}
          </p>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{task.dueLabel}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{isDone ? "完了" : cfg.label}</span>
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

      {expanded && !isDone && (
        <div className="border-t border-dashed border-gray-200 px-4 py-3 bg-white/70 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">ステータス変更：</span>
            <select
              value={task.realStatus === "overdue" ? "in_progress" : task.realStatus}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {realStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <span className="w-px h-4 bg-gray-200" />
          <button
            onClick={() => onComplete(task.id)}
            className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-600 transition"
          >
            完了報告
          </button>
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

const notifyOptions = [
  { id: "check",    label: "タスク確認依頼",   desc: "進捗の確認をお願いします" },
  { id: "report",   label: "報告依頼",         desc: "現状の報告をお願いします" },
  { id: "deadline", label: "期日厳守リマインド", desc: "期日が迫っています。対応をお願いします" },
  { id: "support",  label: "サポート提供",      desc: "困っていることがあればお手伝いします" },
];

// ---- 組織タスク行（自分が依頼したタスク） ----
function TeamTaskRow({ task, onNotify }: { task: LocalTask; onNotify: (taskId: string, type: string) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[task.level];
  const isDone = task.realStatus === "completed";
  const assigneeLabel = task.assigneeNames.join("、") || "担当者未割当";

  return (
    <div className={`rounded-lg border transition-all ${cfg.bg} ${cfg.border} ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0 hover:underline">
          <p className={`text-sm text-gray-700 font-medium truncate ${isDone ? "line-through text-gray-400" : ""}`}>{task.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{assigneeLabel}</p>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{task.dueLabel}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{isDone ? "完了" : cfg.label}</span>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{task.category}</span>
          {!isDone && (
            <button
              onClick={() => setOpen(!open)}
              className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition flex-shrink-0"
            >
              通知
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-dashed border-gray-200 px-4 py-3 bg-white/80">
          <p className="text-xs text-gray-500 font-semibold mb-2">{assigneeLabel} に通知を送る</p>
          <div className="flex flex-wrap gap-2">
            {notifyOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onNotify(task.id, opt.id); setOpen(false); }}
                className="text-xs bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-50 transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- メインパネル ----
export default function TaskAlertPanel() {
  const [meId, setMeId] = useState("");
  const [myTasks, setMyTasks] = useState<LocalTask[]>([]);
  const [teamTasks, setTeamTasks] = useState<LocalTask[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showTeamTasks, setShowTeamTasks] = useState(false);
  const [showNotif, setShowNotif] = useState(true);

  const [completeTarget, setCompleteTarget] = useState<string | null>(null);
  const [deadlineTarget, setDeadlineTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    if (!id) return;
    const all = await apiListTasks();
    const mine = all.filter((t) => t.members.some((m) => m.id === id && m.role !== "owner"));
    const owned = all.filter((t) => t.ownerId === id);
    setMyTasks(mine.map(toLocal));
    setTeamTasks(owned.map(toLocal));
    setNotifications(buildNotifications(all, id));
  }, []);

  useEffect(() => {
    const s = getClientSession();
    const id = sessionMemberId(s) || "";
    setMeId(id);
    load(id);
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await apiSetStatus(id, status);
    await load(meId);
  };

  const handleComplete = async (comment: string) => {
    if (!completeTarget) return;
    await apiSetStatus(completeTarget, "completed");
    await apiAddMessage(completeTarget, {
      subject: "完了報告",
      toIds: ["all"],
      toNames: ["全員"],
      text: comment.trim() ? `タスクが完了しました。${comment.trim()}` : "タスクが完了しました。ご確認をお願いします。",
    });
    setCompleteTarget(null);
    await load(meId);
    showToast("完了報告を送信しました。作成者に通知されます。");
  };

  const handleDeadlineSubmit = async (newDate: string, reason: string) => {
    if (!deadlineTarget) return;
    await apiEditTask(deadlineTarget, { deadline: newDate });
    await apiAddMessage(deadlineTarget, {
      subject: "期日変更依頼",
      toIds: ["all"],
      toNames: ["全員"],
      text: `期日を ${newDate} に変更しました。理由: ${reason}`,
    });
    setDeadlineTarget(null);
    await load(meId);
    showToast("期日変更を申請しました。関係メンバーに通知しました。");
  };

  const handleNotify = async (taskId: string, type: string) => {
    const opt = notifyOptions.find((o) => o.id === type);
    await apiAddMessage(taskId, {
      subject: opt?.label ?? "リマインド",
      toIds: ["all"],
      toNames: ["全員"],
      text: opt?.desc ?? "対応をお願いします。",
    });
    await load(meId);
    showToast(`「${opt?.label}」の通知を送信しました`);
  };

  const todayCount = myTasks.filter((t) => (t.level === "today" || t.level === "overdue") && t.realStatus !== "completed").length;
  const overdueTeam = teamTasks.filter((t) => t.level === "overdue" && t.realStatus !== "completed").length;
  const todayTeam   = teamTasks.filter((t) => t.level === "today" && t.realStatus !== "completed").length;
  const soonTeam    = teamTasks.filter((t) => t.level === "soon" && t.realStatus !== "completed").length;

  const completeTask = myTasks.find((t) => t.id === completeTarget) ?? null;
  const deadlineTask = myTasks.find((t) => t.id === deadlineTarget) ?? null;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 space-y-3 py-4">

        {/* 通知（追いかけ・完了報告） */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-500 tracking-wide uppercase">通知</span>
                <span className="w-px h-3 bg-gray-300" />
                <span className="text-sm font-bold text-emerald-600">{notifications.length}件のお知らせ</span>
              </div>
              <button onClick={() => setShowNotif(!showNotif)} className="text-xs text-emerald-600 font-semibold hover:underline">
                {showNotif ? "閉じる" : "表示"}
              </button>
            </div>
            {showNotif && (
              <div className="p-3 space-y-1.5">
                {notifications.slice(0, 8).map((n) => {
                  const cfg = statusConfig[n.level];
                  return (
                    <Link key={n.id} href={`/tasks/${n.taskId}`}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 hover:shadow-sm transition ${cfg.bg} ${cfg.border}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${n.kind === "report" ? "bg-emerald-500" : cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{n.title}</p>
                        <p className="text-xs text-gray-400 truncate">{n.detail}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${n.kind === "report" ? "bg-emerald-500 text-white" : cfg.badge}`}>
                        {n.kind === "report" ? "完了報告" : cfg.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 個人タスク（自分が担当） */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-gray-500 tracking-wide uppercase">個人タスク（自分の担当）</span>
              <span className="w-px h-3 bg-gray-300" />
              {todayCount > 0 ? (
                <span className="text-sm font-bold text-amber-600">要対応タスクが{todayCount}件あります</span>
              ) : (
                <span className="text-sm font-medium text-gray-400">要対応の締切タスクはありません</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMyTasks(!showMyTasks)} className="text-xs text-emerald-600 font-semibold hover:underline">
                {showMyTasks ? "閉じる" : "詳細表示"}
              </button>
              <Link href="/tasks" className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg transition">
                タスク管理へ
              </Link>
            </div>
          </div>
          {showMyTasks && (
            <div className="p-3 space-y-2">
              {myTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">自分が担当のタスクはありません</p>
              ) : (
                myTasks.map((t) => (
                  <MyTaskRow
                    key={t.id}
                    task={t}
                    onStatusChange={handleStatusChange}
                    onComplete={(id) => setCompleteTarget(id)}
                    onDeadlineRequest={(id) => setDeadlineTarget(id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* 組織タスク（自分が依頼） */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-gray-500 tracking-wide uppercase">依頼したタスク</span>
              <span className="w-px h-3 bg-gray-300" />
              {overdueTeam > 0 && <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">期日超過 {overdueTeam}件</span>}
              {todayTeam  > 0 && <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">本日締切 {todayTeam}件</span>}
              {soonTeam   > 0 && <span className="text-xs font-bold bg-blue-400 text-white px-2 py-0.5 rounded-full">期日間近 {soonTeam}件</span>}
              {overdueTeam + todayTeam + soonTeam === 0 && <span className="text-sm font-medium text-gray-400">直近の締切はありません</span>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowTeamTasks(!showTeamTasks)} className="text-xs text-emerald-600 font-semibold hover:underline">
                {showTeamTasks ? "閉じる" : "詳細表示"}
              </button>
              <Link href="/tasks?tab=org" className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg transition">
                タスク管理へ
              </Link>
            </div>
          </div>
          {showTeamTasks && (
            <div className="p-3 space-y-2">
              {teamTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">自分が依頼したタスクはありません</p>
              ) : (
                teamTasks.map((t) => <TeamTaskRow key={t.id} task={t} onNotify={handleNotify} />)
              )}
            </div>
          )}
        </div>
      </div>

      {completeTask && (
        <CompleteModal task={completeTask} onClose={() => setCompleteTarget(null)} onSubmit={handleComplete} />
      )}
      {deadlineTask && (
        <DeadlineModal task={deadlineTask} onClose={() => setDeadlineTarget(null)} onSubmit={handleDeadlineSubmit} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </>
  );
}
