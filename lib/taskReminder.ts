import type { FullTask } from "@/lib/taskStore";

/** 期日ベースの追いかけ（画面内リマインド）を算出する。 */

export type ReminderLevel = "overdue" | "today" | "soon" | "normal" | "done";

const SOON_DAYS = 3;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function reminderLevel(task: FullTask, now: Date = new Date()): ReminderLevel {
  if (task.status === "completed") return "done";
  if (!task.deadline) return "normal";
  const due = new Date(task.deadline);
  if (Number.isNaN(due.getTime())) return "normal";
  const today = startOfDay(now);
  const dueDay = startOfDay(due);
  const hasTime = task.deadline.includes("T");
  const dueTs = hasTime ? due.getTime() : dueDay + 86400000 - 1; // 時刻なしは当日末まで
  if (dueTs < now.getTime()) return "overdue";
  if (dueDay === today) return "today";
  const diffDays = Math.ceil((dueDay - today) / 86400000);
  if (diffDays > 0 && diffDays <= SOON_DAYS) return "soon";
  return "normal";
}

export const REMINDER_STYLE: Record<ReminderLevel, { label: string; badge: string; dot: string }> = {
  overdue: { label: "期日超過", badge: "bg-rose-500 text-white", dot: "bg-rose-500" },
  today:   { label: "本日締切", badge: "bg-orange-500 text-white", dot: "bg-orange-500" },
  soon:    { label: "期日間近", badge: "bg-amber-400 text-amber-900", dot: "bg-amber-400" },
  normal:  { label: "", badge: "bg-zinc-200 text-zinc-600", dot: "bg-zinc-400" },
  done:    { label: "完了", badge: "bg-emerald-500 text-white", dot: "bg-emerald-500" },
};

export type TaskNotification = {
  id: string;
  taskId: string;
  kind: "reminder" | "report";
  level: ReminderLevel;
  title: string;
  detail: string;
  at: string;
};

/** マイページ用の画面内通知フィードを派生生成する。 */
export function buildNotifications(tasks: FullTask[], meId: string, now: Date = new Date()): TaskNotification[] {
  const list: TaskNotification[] = [];
  for (const t of tasks) {
    const iAmAssignee = t.members.some((m) => m.id === meId && m.role !== "owner");
    const iAmOwner = t.ownerId === meId;

    // 自分が担当の未完了で追いかけが必要なもの
    if (iAmAssignee) {
      const lv = reminderLevel(t, now);
      if (lv === "overdue" || lv === "today" || lv === "soon") {
        list.push({
          id: `rem-${t.id}`,
          taskId: t.id,
          kind: "reminder",
          level: lv,
          title: `${REMINDER_STYLE[lv].label}: ${t.title}`,
          detail: `${t.talkName ? `${t.talkName} / ` : ""}${t.category}`,
          at: t.deadline || t.updatedAt,
        });
      }
    }

    // 自分が作成者のタスクに完了報告 or 完了ステータス
    if (iAmOwner) {
      const doneMsg = [...t.messages]
        .reverse()
        .find((m) => m.senderId !== meId && (m.subject.includes("完了") || m.text.includes("完了しました")));
      if (t.status === "completed" || doneMsg) {
        list.push({
          id: `rep-${t.id}`,
          taskId: t.id,
          kind: "report",
          level: "done",
          title: `完了報告が届きました: ${t.title}`,
          detail: doneMsg ? `${doneMsg.senderName}: ${doneMsg.text.slice(0, 40)}` : "担当者がタスクを完了にしました",
          at: t.completedAt || doneMsg?.sentAt || t.updatedAt,
        });
      }
    }
  }
  return list.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
}

/** 担当者ごとの未完了件数（バッジ用）。 */
export function unfinishedCountByAssignee(tasks: FullTask[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status === "completed" || t.archived) continue;
    for (const m of t.members) {
      if (m.role === "owner") continue;
      map[m.id] = (map[m.id] ?? 0) + 1;
    }
  }
  return map;
}
