export type TaskMemberRole = "owner" | "assignee" | "watcher";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "overdue";
export type TaskType = "personal" | "org";
export type TaskPriority = "high" | "medium" | "low";

export type TaskMember = {
  id: string;
  name: string;
  role: TaskMemberRole;
  joinedAt: string;
};

export type TaskMessage = {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;           // 件名
  toIds: string[];           // 宛先ID配列 (["all"] or ["001","002"])
  toNames: string[];         // 宛先表示名配列
  text: string;
  sentAt: string;
  reactions?: Record<string, string[]>;
  replyToId?: string;        // 返信先メッセージID
};

export type FullTask = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  category: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerName: string;
  members: TaskMember[];
  messages: TaskMessage[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

const STORAGE_KEY = "keyatree_tasks_v1";
const SEED_FLAG = "keyatree_tasks_seed_v1";

export const MOCK_EMPLOYEES = [
  { id: "001", name: "鈴木 一郎", department: "営業部" },
  { id: "002", name: "田中 花子", department: "管理部" },
  { id: "003", name: "佐藤 次郎", department: "営業部" },
  { id: "004", name: "山本 三郎", department: "物件管理部" },
  { id: "005", name: "中村 美咲", department: "経営管理部" },
  { id: "006", name: "小林 健太", department: "営業部" },
  { id: "007", name: "伊藤 由美", department: "管理部" },
];

const SEED_TASKS: FullTask[] = [
  {
    id: "seed-t1",
    title: "山田様 物件案内資料の作成",
    description: "山田様向けに新築マンションの案内資料を作成する。間取り図・価格表・周辺施設マップを含める。",
    deadline: "2026-06-20",
    category: "営業",
    type: "personal",
    priority: "high",
    status: "in_progress",
    ownerId: "001",
    ownerName: "鈴木 一郎",
    members: [
      { id: "001", name: "鈴木 一郎", role: "owner",   joinedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "002", name: "田中 花子", role: "watcher",  joinedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    ],
    messages: [
      { id: "m1", senderId: "001", senderName: "鈴木 一郎", subject: "資料方向性の確認", toIds: ["all"], toNames: ["全員"], text: "山田様案件を開始しました。資料の方向性について確認させてください。", sentAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "m2", senderId: "002", senderName: "田中 花子", subject: "Re: 資料方向性の確認", toIds: ["001"], toNames: ["鈴木 一郎"], text: "了解しました。先方は3LDK以上を希望されているので、その条件に絞って作成してください。", sentAt: new Date(Date.now() - 1 * 86400000).toISOString(), replyToId: "m1" },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "seed-t2",
    title: "Q2営業報告書の提出",
    description: "第2四半期の営業実績をまとめて報告書を作成・提出する。売上・案件数・新規顧客数を記載。",
    deadline: "2026-06-18",
    category: "報告",
    type: "personal",
    priority: "high",
    status: "overdue",
    ownerId: "001",
    ownerName: "鈴木 一郎",
    members: [
      { id: "001", name: "鈴木 一郎", role: "owner",    joinedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: "002", name: "田中 花子", role: "assignee",  joinedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
    ],
    messages: [
      { id: "m3", senderId: "002", senderName: "田中 花子", subject: "Q2報告書の対応状況確認", toIds: ["001"], toNames: ["鈴木 一郎"], text: "Q2報告書の提出期限が近づいています。対応状況を教えてください。", sentAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "seed-t3",
    title: "下半期予算計画書の承認",
    description: "下半期の各部門予算計画書を取りまとめ、役員会での承認を得る。",
    deadline: "2026-06-25",
    category: "管理",
    type: "org",
    priority: "high",
    status: "in_progress",
    ownerId: "002",
    ownerName: "田中 花子",
    members: [
      { id: "002", name: "田中 花子", role: "owner",    joinedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: "001", name: "鈴木 一郎", role: "assignee", joinedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: "003", name: "佐藤 次郎", role: "assignee", joinedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    ],
    messages: [
      { id: "m4", senderId: "002", senderName: "田中 花子", subject: "下半期予算案の提出依頼", toIds: ["all"], toNames: ["全員"], text: "各部門の予算案を6月22日までに提出してください。フォーマットは昨年度と同様です。", sentAt: new Date(Date.now() - 4 * 86400000).toISOString() },
      { id: "m5", senderId: "001", senderName: "鈴木 一郎", subject: "Re: 下半期予算案の提出依頼", toIds: ["002"], toNames: ["田中 花子"], text: "営業部分は作成中です。明日中に送ります。", sentAt: new Date(Date.now() - 3 * 86400000).toISOString(), replyToId: "m4" },
      { id: "m6", senderId: "003", senderName: "佐藤 次郎", subject: "Re: 下半期予算案の提出依頼", toIds: ["002"], toNames: ["田中 花子"], text: "確認しました。こちらも並行して進めます。", sentAt: new Date(Date.now() - 2 * 86400000).toISOString(), replyToId: "m4" },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "seed-t4",
    title: "顧客アンケート集計",
    description: "先月実施した顧客満足度アンケートを集計し、改善提案をまとめる。",
    deadline: "2026-06-22",
    category: "営業",
    type: "org",
    priority: "medium",
    status: "not_started",
    ownerId: "003",
    ownerName: "佐藤 次郎",
    members: [
      { id: "003", name: "佐藤 次郎", role: "owner",   joinedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "004", name: "山本 三郎", role: "watcher",  joinedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    messages: [],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function readAll(): FullTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FullTask[]) : [];
  } catch {
    return [];
  }
}

function writeAll(tasks: FullTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function seedTasks() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  const existing = readAll();
  if (existing.length === 0) {
    writeAll(SEED_TASKS);
  }
  window.localStorage.setItem(SEED_FLAG, "1");
}

export function getAllTasks(): FullTask[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTask(id: string): FullTask | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function saveTask(task: FullTask) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    all[idx] = { ...task, updatedAt: new Date().toISOString() };
  } else {
    all.unshift(task);
  }
  writeAll(all);
}

export function createTask(input: Omit<FullTask, "id" | "createdAt" | "updatedAt" | "messages">): FullTask {
  const now = new Date().toISOString();
  const task: FullTask = {
    ...input,
    id: crypto.randomUUID(),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const all = readAll();
  all.unshift(task);
  writeAll(all);
  return task;
}

export function addMessage(taskId: string, msg: Omit<TaskMessage, "id" | "sentAt">): FullTask | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;
  const newMsg: TaskMessage = {
    ...msg,
    id: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
  };
  all[idx].messages = [...all[idx].messages, newMsg];
  all[idx].updatedAt = new Date().toISOString();
  writeAll(all);
  return all[idx];
}

export function updateTaskStatus(taskId: string, status: TaskStatus): FullTask | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;
  all[idx].status = status;
  all[idx].updatedAt = new Date().toISOString();
  if (status === "completed") all[idx].completedAt = new Date().toISOString();
  writeAll(all);
  return all[idx];
}

export function addMember(taskId: string, member: TaskMember): FullTask | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;
  if (all[idx].members.some((m) => m.id === member.id)) return all[idx];
  all[idx].members = [...all[idx].members, member];
  all[idx].updatedAt = new Date().toISOString();
  writeAll(all);
  return all[idx];
}

export function removeMember(taskId: string, memberId: string): FullTask | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;
  all[idx].members = all[idx].members.filter((m) => m.id !== memberId || m.role === "owner");
  all[idx].updatedAt = new Date().toISOString();
  writeAll(all);
  return all[idx];
}

export function toggleReaction(taskId: string, msgId: string, emoji: string, userId: string): FullTask | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;
  const msgIdx = all[idx].messages.findIndex((m) => m.id === msgId);
  if (msgIdx < 0) return null;
  const msg = all[idx].messages[msgIdx];
  const reactions = { ...(msg.reactions || {}) };
  const users = reactions[emoji] || [];
  if (users.includes(userId)) {
    const next = users.filter((u) => u !== userId);
    if (next.length === 0) delete reactions[emoji];
    else reactions[emoji] = next;
  } else {
    reactions[emoji] = [...users, userId];
  }
  all[idx].messages[msgIdx] = { ...msg, reactions };
  all[idx].updatedAt = new Date().toISOString();
  writeAll(all);
  return all[idx];
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string; border: string; badge: string; dot: string }> = {
  not_started: { label: "未着手",   bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200",   badge: "bg-gray-200 text-gray-600",     dot: "bg-gray-400" },
  in_progress:  { label: "進行中",   bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   badge: "bg-blue-500 text-white",         dot: "bg-blue-500" },
  completed:    { label: "完了",     bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",badge: "bg-emerald-500 text-white",      dot: "bg-emerald-500" },
  overdue:      { label: "期日超過", bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",   badge: "bg-rose-500 text-white",         dot: "bg-rose-500" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  high:   { label: "高",   color: "text-rose-600 bg-rose-50 border-rose-200" },
  medium: { label: "中",   color: "text-amber-600 bg-amber-50 border-amber-200" },
  low:    { label: "低",   color: "text-gray-500 bg-gray-50 border-gray-200" },
};

export const CATEGORIES = ["営業", "管理", "報告", "契約", "物件管理", "研修", "総務", "経営", "その他"];
