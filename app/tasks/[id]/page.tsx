"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTask, addMessage, updateTaskStatus, addMember, removeMember, toggleReaction,
  MOCK_EMPLOYEES, STATUS_CONFIG, PRIORITY_CONFIG,
  type FullTask, type TaskStatus, type TaskMember, type TaskMessage,
} from "@/lib/taskStore";

/* ── ユーティリティ ── */
function fmtDT(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function fmtD(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
}

/** テキストにハイライトを適用 */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "overdue",     label: "期日超過" },
  { value: "completed",   label: "完了" },
];

const CURRENT_USER = { id: "001", name: "鈴木 一郎" };
const EMOJI_LIST = ["👍","✅","🙏","💪","🔥","😊","👏","❤️"];

/* ── 絵文字ピッカー ── */
function EmojiPicker({ onSelect }: { onSelect: (e: string) => void }) {
  return (
    <div className="absolute z-30 bottom-full mb-1 bg-white border border-gray-200 rounded-2xl shadow-lg px-2 py-1.5 flex gap-1 whitespace-nowrap">
      {EMOJI_LIST.map(e => (
        <button key={e} onClick={ev => { ev.stopPropagation(); onSelect(e); }}
          className="text-lg hover:scale-125 transition-transform">{e}</button>
      ))}
    </div>
  );
}

/* ── 宛先バッジ ── */
function ToBadges({ toIds, toNames }: { toIds: string[]; toNames: string[] }) {
  if (!toIds || toIds[0] === "all") {
    return <span className="inline-flex items-center text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">全員</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {toNames.map((n, i) => (
        <span key={i} className="inline-flex items-center text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">{n}</span>
      ))}
    </span>
  );
}

/* ── 1件のメッセージバブル ── */
function MessageBubble({
  msg, allMessages, taskId, query, onReaction, onReply,
}: {
  msg: TaskMessage;
  allMessages: TaskMessage[];
  taskId: string;
  query: string;
  onReaction: (t: FullTask) => void;
  onReply: (msg: TaskMessage) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const isMe = msg.senderId === CURRENT_USER.id;
  const isSystem = msg.senderId === "system";
  const parentMsg = msg.replyToId ? allMessages.find(m => m.id === msg.replyToId) : null;

  if (isSystem) {
    return (
      <div className="text-center py-1">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.text}</span>
      </div>
    );
  }

  const reactions = msg.reactions ?? {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className={`group flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold self-end ${isMe ? "bg-emerald-500" : "bg-indigo-400"}`}>
        {msg.senderName.charAt(0)}
      </div>
      <div className={`flex flex-col gap-0.5 max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"}`}>
        {/* 件名 + 宛先 */}
        <div className={`flex flex-wrap items-center gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className="text-xs font-bold text-gray-600">
            <Highlight text={msg.subject || "（件名なし）"} query={query} />
          </span>
          <span className="text-xs text-gray-400">→</span>
          <ToBadges toIds={msg.toIds ?? ["all"]} toNames={msg.toNames ?? ["全員"]} />
        </div>
        {/* 返信元プレビュー */}
        {parentMsg && (
          <div className={`w-full border-l-2 border-gray-300 pl-2 mb-0.5 ${isMe ? "text-right" : "text-left"}`}>
            <p className="text-xs text-gray-400 truncate">{parentMsg.senderName}: {parentMsg.text}</p>
          </div>
        )}
        {/* バブル + アクション */}
        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-emerald-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
            <Highlight text={msg.text} query={query} />
          </div>
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
            <button onClick={() => onReply(msg)}
              className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50"
              title="返信">
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-gray-500" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 10l5-5v3h5a4 4 0 010 8H8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={() => setShowPicker(v => !v)}
              className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50"
              title="リアクション">
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-gray-500" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="8"/>
                <path d="M7 12s1 2 3 2 3-2 3-2" strokeLinecap="round"/>
                <circle cx="7.5" cy="8.5" r="0.75" fill="currentColor" stroke="none"/>
                <circle cx="12.5" cy="8.5" r="0.75" fill="currentColor" stroke="none"/>
              </svg>
            </button>
            {showPicker && <EmojiPicker onSelect={emoji => {
              const u = toggleReaction(taskId, msg.id, emoji, CURRENT_USER.id);
              if (u) onReaction(u);
              setShowPicker(false);
            }} />}
          </div>
        </div>
        {hasReactions && (
          <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, users]) => {
              const reacted = users.includes(CURRENT_USER.id);
              return (
                <button key={emoji}
                  onClick={() => { const u = toggleReaction(taskId, msg.id, emoji, CURRENT_USER.id); if (u) onReaction(u); }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-xs transition ${reacted ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {emoji}<span className="font-bold">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
        <span className="text-xs text-gray-300">{fmtDT(msg.sentAt)}</span>
      </div>
    </div>
  );
}

/* ── スレッドカード（折りたたみ＋スライド） ── */
type Thread = { root: TaskMessage; replies: TaskMessage[] };

function ThreadCard({
  thread, allMessages, taskId, query, onReaction, onReply, defaultOpen,
}: {
  thread: Thread;
  allMessages: TaskMessage[];
  taskId: string;
  query: string;
  onReaction: (t: FullTask) => void;
  onReply: (msg: TaskMessage) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { root, replies } = thread;
  const total = 1 + replies.length;
  const isSystem = root.senderId === "system";

  if (isSystem) {
    return (
      <div className="text-center py-1">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{root.text}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* スレッドヘッダー（常時表示） */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${root.senderId === CURRENT_USER.id ? "bg-emerald-500" : "bg-indigo-400"}`}>
            {root.senderName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700 truncate">
                <Highlight text={root.subject || "（件名なし）"} query={query} />
              </span>
              <ToBadges toIds={root.toIds ?? ["all"]} toNames={root.toNames ?? ["全員"]} />
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              <Highlight text={root.text} query={query} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {total > 1 && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {total}件
            </span>
          )}
          <span className="text-xs text-gray-400">{fmtDT(root.sentAt).slice(5)}</span>
          <button
            onClick={() => setOpen(v => !v)}
            className="text-xs text-gray-400 hover:text-emerald-600 transition px-1"
          >
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* 展開部分（スライドアニメーション） */}
      <div className={`transition-all duration-300 overflow-hidden ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t bg-gray-50 px-4 py-4 space-y-4">
          <MessageBubble msg={root} allMessages={allMessages} taskId={taskId} query={query} onReaction={onReaction} onReply={onReply} />
          {replies.length > 0 && (
            <div className="border-l-2 border-emerald-200 pl-4 space-y-4">
              {replies.map(reply => (
                <MessageBubble key={reply.id} msg={reply} allMessages={allMessages} taskId={taskId} query={query} onReaction={onReaction} onReply={onReply} />
              ))}
            </div>
          )}
          {/* 返信ボタン */}
          <div className="pt-1">
            <button
              onClick={() => onReply(root)}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              このスレッドに返信する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── メッセージ作成フォーム ── */
function ComposePanel({
  members, replyTo, onSend, onCancelReply,
}: {
  members: TaskMember[];
  replyTo: TaskMessage | null;
  onSend: (subject: string, toIds: string[], toNames: string[], text: string, replyToId?: string) => void;
  onCancelReply: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [toAll, setToAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) {
      setSubject(`Re: ${replyTo.subject || ""}`);
      setToAll(false);
      const sid = replyTo.senderId;
      if (sid !== CURRENT_USER.id && sid !== "system") setSelectedIds([sid]);
      bodyRef.current?.focus();
    }
  }, [replyTo?.id]);

  const toggleId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setToAll(false);
  };

  const recipientLabel = toAll ? "全員" : selectedIds.length > 0
    ? members.filter(m => selectedIds.includes(m.id)).map(m => m.name).join("、")
    : "宛先を選択してください";
  const recipientValid = toAll || selectedIds.length > 0;
  const canSend = subject.trim() && recipientValid && body.trim();

  const handleSend = () => {
    if (!canSend) return;
    const toIds   = toAll ? ["all"] : selectedIds;
    const toNames = toAll ? ["全員"] : members.filter(m => selectedIds.includes(m.id)).map(m => m.name);
    onSend(subject.trim(), toIds, toNames, body.trim(), replyTo?.id);
    setSubject(""); setToAll(false); setSelectedIds([]); setBody("");
  };

  const otherMembers = members.filter(m => m.id !== CURRENT_USER.id);

  return (
    <div className="border-t bg-white">
      {replyTo && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 mb-0.5">返信先: {replyTo.subject}</p>
            <p className="text-xs text-gray-400 truncate">{replyTo.senderName}: {replyTo.text}</p>
          </div>
          <button onClick={onCancelReply} className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-xs mt-0.5">×</button>
        </div>
      )}
      <div className="p-3 space-y-2">
        {/* 件名 */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 w-10 flex-shrink-0">件名</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="メッセージの件名を入力"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        {/* 宛先 */}
        <div className="flex items-start gap-2">
          <label className="text-xs font-bold text-gray-500 w-10 flex-shrink-0 mt-1.5">宛先</label>
          <div className="flex-1">
            <button onClick={() => setShowMemberList(v => !v)}
              className={`w-full text-left border rounded-lg px-3 py-1.5 text-sm transition flex items-center justify-between ${recipientValid ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"}`}>
              <span className={recipientValid ? "text-emerald-800 font-semibold" : "text-gray-400"}>{recipientLabel}</span>
              <span className="text-gray-400 text-xs">{showMemberList ? "▲" : "▼"}</span>
            </button>
            {showMemberList && (
              <div className="mt-1 border border-gray-200 rounded-xl bg-white shadow-md overflow-hidden z-20 relative">
                <button onClick={() => { setToAll(true); setSelectedIds([]); setShowMemberList(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-teal-50 transition ${toAll ? "bg-teal-50 font-bold text-teal-700" : "text-gray-700"}`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${toAll ? "bg-teal-500 border-teal-500" : "border-gray-300"}`}>
                    {toAll && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  全員に送信
                </button>
                <div className="h-px bg-gray-100" />
                {otherMembers.map(m => {
                  const checked = selectedIds.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleId(m.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-indigo-50 transition ${checked ? "bg-indigo-50 font-bold text-indigo-700" : "text-gray-700"}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? "bg-indigo-500 border-indigo-500" : "border-gray-300"}`}>
                        {checked && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">{m.name.charAt(0)}</div>
                      <span>{m.name}</span>
                    </button>
                  );
                })}
                {selectedIds.length > 0 && (
                  <div className="px-3 py-2 border-t">
                    <button onClick={() => setShowMemberList(false)}
                      className="w-full py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition">
                      選択を確定する（{selectedIds.length}名）
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* 本文 + 送信 */}
        <div className="flex gap-2 items-end">
          <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} rows={2}
            placeholder="メッセージ本文を入力"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <button onClick={handleSend} disabled={!canSend}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex-shrink-0">
            送信
          </button>
        </div>
        {/* ファイル添付（Supabase Storage接続後に対応） */}
        <div className="flex items-center gap-2 pt-1">
          <button disabled className="flex items-center gap-1.5 text-xs text-gray-300 cursor-not-allowed border border-dashed border-gray-200 rounded-lg px-3 py-1.5">
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            ファイル・写真を添付
          </button>
          <span className="text-xs text-gray-300">Supabase Storage 接続後に対応予定</span>
        </div>
        {!recipientValid && body.trim() && (
          <p className="text-xs text-rose-500 font-semibold">宛先を選択してください（全員 または 個別指名）</p>
        )}
      </div>
    </div>
  );
}

/* ── メインページ ── */
export default function TaskWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<FullTask | null>(null);
  const [replyTo, setReplyTo] = useState<TaskMessage | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = getTask(id);
    if (!t) { router.push("/tasks"); return; }
    setTask(t);
  }, [id, router]);

  useEffect(() => {
    if (!searchQuery) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task?.messages.length, searchQuery]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showSearch]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* スレッドをグループ化 */
  const threads = useMemo<Thread[]>(() => {
    if (!task) return [];
    const msgs = task.messages;
    const rootMsgs = msgs.filter(m => !m.replyToId);
    return rootMsgs.map(root => ({
      root,
      replies: msgs.filter(m => m.replyToId === root.id),
    }));
  }, [task?.messages]);

  /* 検索フィルター */
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(th =>
      [th.root, ...th.replies].some(m =>
        m.text.toLowerCase().includes(q) ||
        (m.subject || "").toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q)
      )
    );
  }, [threads, searchQuery]);

  const handleSend = (subject: string, toIds: string[], toNames: string[], text: string, replyToId?: string) => {
    if (!task) return;
    const updated = addMessage(task.id, { senderId: CURRENT_USER.id, senderName: CURRENT_USER.name, subject, toIds, toNames, text, replyToId });
    if (updated) setTask(updated);
    setReplyTo(null);
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (!task) return;
    const updated = updateTaskStatus(task.id, status);
    if (updated) { setTask(updated); showToast(`ステータスを「${STATUS_CONFIG[status].label}」に変更しました`); }
  };

  const handleInvite = (emp: typeof MOCK_EMPLOYEES[number]) => {
    if (!task) return;
    const member: TaskMember = { id: emp.id, name: emp.name, role: "assignee", joinedAt: new Date().toISOString() };
    const updated = addMember(task.id, member);
    if (updated) {
      setTask(updated);
      showToast(`${emp.name} をメンバーに追加しました`);
      const withMsg = addMessage(task.id, { senderId: "system", senderName: "システム", subject: "メンバー追加", toIds: ["all"], toNames: ["全員"], text: `${emp.name} がメンバーに追加されました。` });
      if (withMsg) setTask(withMsg);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!task) return;
    const updated = removeMember(task.id, memberId);
    if (updated) { setTask(updated); showToast(`${memberName} をメンバーから除外しました`); }
  };

  if (!task) return null;

  const cfg = STATUS_CONFIG[task.status];
  const pri = PRIORITY_CONFIG[task.priority];
  const notInvited = MOCK_EMPLOYEES.filter(e => !task.members.some(m => m.id === e.id));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <Link href="/tasks" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">タスク管理</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium truncate max-w-xs">{task.title}</span>
          <div className="ml-auto">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 py-4 flex flex-col lg:flex-row gap-4 flex-1">
        <div className="flex-1 flex flex-col min-h-0 gap-3">

          {/* タスク詳細バー */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <button onClick={() => setDetailOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-sm font-bold text-gray-800 truncate">{task.title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${pri.color}`}>{pri.label}優先</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${task.type === "personal" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                  {task.type === "personal" ? "個人" : "組織"}
                </span>
              </div>
              <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{detailOpen ? "▲ 閉じる" : "▼ 詳細"}</span>
            </button>
            {detailOpen && (
              <div className="px-4 pb-4 border-t pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><p className="text-xs text-gray-400 mb-0.5">期日</p><p className="text-sm font-semibold text-gray-700">{fmtD(task.deadline)}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">カテゴリ</p><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{task.category}</span></div>
                <div><p className="text-xs text-gray-400 mb-0.5">作成者</p><p className="text-sm text-gray-700">{task.ownerName}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">作成日</p><p className="text-xs text-gray-600">{fmtD(task.createdAt)}</p></div>
                {task.description && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-xs text-gray-400 mb-0.5">詳細</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* スレッドエリア（固定高さ・スクロール） */}
          <div className="flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ height: "540px" }}>

            {/* スレッドヘッダー */}
            <div className="border-b px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-gray-700">スレッド</span>
              {task.messages.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{task.messages.length}</span>
              )}
              {searchQuery && filteredThreads.length !== threads.length && (
                <span className="text-xs text-amber-600 font-bold">{filteredThreads.length}件ヒット</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {/* 検索 */}
                {showSearch ? (
                  <div className="flex items-center gap-1">
                    <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="メッセージを検索..."
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="text-gray-400 hover:text-gray-600 text-xs">×</button>
                  </div>
                ) : (
                  <button onClick={() => setShowSearch(true)}
                    className="text-xs text-gray-400 hover:text-emerald-600 transition flex items-center gap-1">
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="9" cy="9" r="6"/><path d="M15 15l-3-3" strokeLinecap="round"/>
                    </svg>
                    検索
                  </button>
                )}
                <span className="text-xs text-gray-400">メンバー {task.members.length}名</span>
              </div>
            </div>

            {/* スレッドリスト（スクロール可能） */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredThreads.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  {searchQuery
                    ? <><p className="text-sm font-medium">「{searchQuery}」に一致するメッセージがありません</p><button onClick={() => setSearchQuery("")} className="text-xs text-emerald-600 mt-2 hover:underline">検索をクリア</button></>
                    : <><p className="text-sm font-medium">まだメッセージがありません</p><p className="text-xs mt-1">件名と宛先を選んで最初のメッセージを送りましょう</p></>
                  }
                </div>
              )}
              {filteredThreads.map((thread, i) => (
                <ThreadCard
                  key={thread.root.id}
                  thread={thread}
                  allMessages={task.messages}
                  taskId={task.id}
                  query={searchQuery}
                  onReaction={setTask}
                  onReply={setReplyTo}
                  defaultOpen={i === filteredThreads.length - 1}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* 作成フォーム */}
            <ComposePanel members={task.members} replyTo={replyTo} onSend={handleSend} onCancelReply={() => setReplyTo(null)} />
          </div>
        </div>

        {/* 右サイドバー */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          {/* ステータス */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">ステータス変更</p>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(opt => {
                const c = STATUS_CONFIG[opt.value];
                const active = task.status === opt.value;
                return (
                  <button key={opt.value} onClick={() => handleStatusChange(opt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${active ? `${c.bg} ${c.border} ${c.text}` : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {opt.label}
                    {active && <span className="ml-auto text-xs">現在</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {/* メンバー */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">メンバー ({task.members.length})</p>
              {notInvited.length > 0 && (
                <button onClick={() => setShowInvite(!showInvite)} className="text-xs text-emerald-600 font-bold hover:underline">+ 招待</button>
              )}
            </div>
            <div className="space-y-2">
              {task.members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{m.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.role === "owner" ? "オーナー" : m.role === "assignee" ? "担当者" : "閲覧者"}</p>
                  </div>
                  {m.role !== "owner" && (
                    <button onClick={() => handleRemoveMember(m.id, m.name)} className="text-xs text-gray-300 hover:text-rose-400 transition">×</button>
                  )}
                </div>
              ))}
            </div>
            {showInvite && notInvited.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1.5">
                <p className="text-xs text-gray-400 mb-2">招待できるメンバー</p>
                {notInvited.map(emp => (
                  <button key={emp.id} onClick={() => { handleInvite(emp); setShowInvite(false); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-left transition">
                    <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">{emp.name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.department}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* クイックアクション */}
          <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">クイックアクション</p>
            {[
              { label: "進捗を報告する",    subject: "進捗報告",   text: "進捗を共有します。現在対応中です。引き続きよろしくお願いします。", style: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { label: "サポートを依頼する", subject: "サポート依頼", text: "対応に困っている点があります。サポートをお願いできますか？", style: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
              { label: "完了として報告する", subject: "完了報告",   text: "タスクが完了しました。ご確認をお願いします。", style: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            ].map(action => (
              <button key={action.label}
                onClick={() => {
                  if (action.label === "完了として報告する") handleStatusChange("completed");
                  const u = addMessage(task.id, { senderId: CURRENT_USER.id, senderName: CURRENT_USER.name, subject: action.subject, toIds: ["all"], toNames: ["全員"], text: action.text });
                  if (u) { setTask(u); showToast(`${action.label}を送信しました`); }
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${action.style}`}>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
