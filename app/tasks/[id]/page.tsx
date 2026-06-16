"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTask, addMessage, updateTaskStatus, addMember, removeMember, toggleReaction,
  MOCK_EMPLOYEES, STATUS_CONFIG, PRIORITY_CONFIG,
  type FullTask, type TaskStatus, type TaskMember,
} from "@/lib/taskStore";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "overdue",     label: "期日超過" },
  { value: "completed",   label: "完了" },
];

const CURRENT_USER = { id: "001", name: "鈴木 一郎" };

const EMOJI_LIST = ["👍", "✅", "🙏", "💪", "🔥", "😊", "👏", "❤️"];

/** 絵文字ピッカー（メッセージにホバーで表示） */
function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="absolute z-20 bottom-full mb-1 bg-white border border-gray-200 rounded-2xl shadow-lg px-2 py-1.5 flex gap-1">
      {EMOJI_LIST.map((e) => (
        <button
          key={e}
          onClick={(ev) => { ev.stopPropagation(); onSelect(e); }}
          className="text-lg hover:scale-125 transition-transform"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

/** 1件のメッセージ */
function MessageBubble({
  msg,
  taskId,
  onReaction,
}: {
  msg: FullTask["messages"][number];
  taskId: string;
  onReaction: (updated: FullTask) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const isMe = msg.senderId === CURRENT_USER.id;
  const isSystem = msg.senderId === "system";

  if (isSystem) {
    return (
      <div className="text-center py-1">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.text}</span>
      </div>
    );
  }

  const reactions = msg.reactions ?? {};
  const hasReactions = Object.keys(reactions).length > 0;

  const handleEmojiSelect = (emoji: string) => {
    const updated = toggleReaction(taskId, msg.id, emoji, CURRENT_USER.id);
    if (updated) onReaction(updated);
    setShowPicker(false);
  };

  return (
    <div className={`group flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* アバター */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold self-end ${isMe ? "bg-emerald-500" : "bg-indigo-400"}`}>
        {msg.senderName.charAt(0)}
      </div>

      <div className={`relative flex flex-col gap-0.5 max-w-xs lg:max-w-sm ${isMe ? "items-end" : "items-start"}`}>
        <span className="text-xs text-gray-400">{msg.senderName}</span>

        {/* バブル + リアクションボタン */}
        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isMe ? "bg-emerald-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
            }`}
          >
            {msg.text}
          </div>

          {/* リアクションボタン（ホバーで出現） */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow text-xs flex items-center justify-center hover:bg-gray-50"
              title="リアクション"
            >
              {/* smile icon */}
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-gray-500" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="8" />
                <path d="M7 12s1 2 3 2 3-2 3-2" strokeLinecap="round" />
                <circle cx="7.5" cy="8.5" r="0.75" fill="currentColor" stroke="none" />
                <circle cx="12.5" cy="8.5" r="0.75" fill="currentColor" stroke="none" />
              </svg>
            </button>
            {showPicker && (
              <EmojiPicker onSelect={handleEmojiSelect} />
            )}
          </div>
        </div>

        {/* 既存リアクション表示 */}
        {hasReactions && (
          <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, users]) => {
              const reacted = users.includes(CURRENT_USER.id);
              return (
                <button
                  key={emoji}
                  onClick={() => {
                    const updated = toggleReaction(taskId, msg.id, emoji, CURRENT_USER.id);
                    if (updated) onReaction(updated);
                  }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-xs transition ${
                    reacted
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        <span className="text-xs text-gray-300">{formatDateTime(msg.sentAt)}</span>
      </div>
    </div>
  );
}

export default function TaskWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<FullTask | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = getTask(id);
    if (!t) { router.push("/tasks"); return; }
    setTask(t);
  }, [id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task?.messages.length]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = () => {
    if (!message.trim() || !task) return;
    setSending(true);
    const updated = addMessage(task.id, {
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      text: message.trim(),
    });
    if (updated) setTask(updated);
    setMessage("");
    setSending(false);
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
      const withMsg = addMessage(task.id, { senderId: "system", senderName: "システム", text: `${emp.name} がメンバーに追加されました。` });
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
  const notInvited = MOCK_EMPLOYEES.filter((e) => !task.members.some((m) => m.id === e.id));

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

        {/* 左：詳細 + チャット */}
        <div className="flex-1 flex flex-col min-h-0 gap-3">

          {/* タスク詳細パネル（常時表示・折りたたみ可） */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <button
              onClick={() => setDetailOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-sm font-bold text-gray-800 truncate max-w-xs">{task.title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pri.color}`}>{pri.label}優先</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.type === "personal" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                  {task.type === "personal" ? "個人" : "組織"}
                </span>
              </div>
              <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{detailOpen ? "▲ 閉じる" : "▼ 詳細"}</span>
            </button>

            {detailOpen && (
              <div className="px-4 pb-4 border-t pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">期日</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(task.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">カテゴリ</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{task.category}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">作成者</p>
                  <p className="text-sm text-gray-700">{task.ownerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">作成日</p>
                  <p className="text-xs text-gray-600">{formatDate(task.createdAt)}</p>
                </div>
                {task.description && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-xs text-gray-400 mb-0.5">詳細</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* チャットエリア */}
          <div className="flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden flex-1" style={{ minHeight: "420px" }}>
            <div className="border-b px-4 py-2.5 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">スレッド</span>
              {task.messages.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{task.messages.length}</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">メンバー {task.members.length}名</span>
            </div>

            {/* メッセージ一覧 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {task.messages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm font-medium">まだメッセージがありません</p>
                  <p className="text-xs mt-1">最初のメッセージを送りましょう</p>
                </div>
              )}
              {task.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  taskId={task.id}
                  onReaction={(updated) => setTask(updated)}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* 入力欄（Enterでは送信しない・ボタンのみ） */}
            <div className="border-t p-3 flex gap-2 items-end bg-gray-50">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="メッセージを入力（Shift+Enter で改行）"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex-shrink-0"
              >
                送信
              </button>
            </div>
          </div>
        </div>

        {/* 右：ステータス・メンバー・アクション */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

          {/* ステータス変更 */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">ステータス変更</p>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const c = STATUS_CONFIG[opt.value];
                const active = task.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${active ? `${c.bg} ${c.border} ${c.text}` : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
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
                <button onClick={() => setShowInvite(!showInvite)} className="text-xs text-emerald-600 font-bold hover:underline">
                  + 招待
                </button>
              )}
            </div>
            <div className="space-y-2">
              {task.members.map((m) => (
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
                {notInvited.map((emp) => (
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
              { label: "進捗を報告する", text: "進捗を共有します。現在対応中です。引き続きよろしくお願いします。", style: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { label: "サポートを依頼する", text: "対応に困っている点があります。サポートをお願いできますか？", style: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
              { label: "完了として報告する", text: "タスクが完了しました。ご確認をお願いします。", style: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  if (action.label === "完了として報告する") handleStatusChange("completed");
                  const updated = addMessage(task.id, { senderId: CURRENT_USER.id, senderName: CURRENT_USER.name, text: action.text });
                  if (updated) { setTask(updated); showToast(`${action.label}を送信しました`); }
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${action.style}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
