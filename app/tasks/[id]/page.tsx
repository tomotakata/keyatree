"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTask, addMessage, updateTaskStatus, addMember, removeMember,
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
  { value: "overdue", label: "期日超過" },
  { value: "completed", label: "完了" },
];

const CURRENT_USER = { id: "001", name: "鈴木 一郎" };

export default function TaskWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<FullTask | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "detail">("chat");
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
    if (updated) {
      setTask(updated);
      showToast(`ステータスを「${STATUS_CONFIG[status].label}」に変更しました`);
    }
  };

  const handleInvite = (emp: typeof MOCK_EMPLOYEES[number]) => {
    if (!task) return;
    const member: TaskMember = {
      id: emp.id,
      name: emp.name,
      role: "assignee",
      joinedAt: new Date().toISOString(),
    };
    const updated = addMember(task.id, member);
    if (updated) {
      setTask(updated);
      showToast(`${emp.name} をメンバーに追加しました`);
      // システムメッセージ
      const withMsg = addMessage(task.id, {
        senderId: "system",
        senderName: "システム",
        text: `${emp.name} がメンバーに追加されました。`,
      });
      if (withMsg) setTask(withMsg);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!task) return;
    const updated = removeMember(task.id, memberId);
    if (updated) {
      setTask(updated);
      showToast(`${memberName} をメンバーから除外しました`);
    }
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
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 py-4 flex flex-col lg:flex-row gap-4 flex-1">

        {/* 左：チャット & 詳細タブ */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* タブ */}
          <div className="flex border-b bg-white rounded-t-2xl">
            <button onClick={() => setTab("chat")} className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${tab === "chat" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              チャット {task.messages.length > 0 && <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{task.messages.length}</span>}
            </button>
            <button onClick={() => setTab("detail")} className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${tab === "detail" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              タスク詳細
            </button>
          </div>

          {tab === "chat" && (
            <div className="flex flex-col flex-1 bg-white rounded-b-2xl border border-t-0 shadow-sm overflow-hidden" style={{ minHeight: "420px" }}>
              {/* メッセージ一覧 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {task.messages.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-sm">まだメッセージがありません</p>
                    <p className="text-xs mt-1">最初のメッセージを送りましょう</p>
                  </div>
                )}
                {task.messages.map((msg) => {
                  const isMe = msg.senderId === CURRENT_USER.id;
                  const isSystem = msg.senderId === "system";
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.text}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${isMe ? "bg-emerald-500" : "bg-indigo-400"}`}>
                        {msg.senderName.charAt(0)}
                      </div>
                      <div className={`max-w-xs lg:max-w-sm ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                        <span className="text-xs text-gray-400">{msg.senderName}</span>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-emerald-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                          {msg.text}
                        </div>
                        <span className="text-xs text-gray-300">{formatDateTime(msg.sentAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* 入力欄 */}
              <div className="border-t p-3 flex gap-2 items-end bg-gray-50">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={2}
                  placeholder="メッセージを入力（Enter で送信・Shift+Enter で改行）"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex-shrink-0"
                >
                  送信
                </button>
              </div>
            </div>
          )}

          {tab === "detail" && (
            <div className="bg-white rounded-b-2xl border border-t-0 shadow-sm p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">タスク名</p>
                <p className="text-base font-bold text-gray-800">{task.title}</p>
              </div>
              {task.description && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">詳細</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">期日</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(task.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">カテゴリ</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{task.category}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">種別</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${task.type === "personal" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                    {task.type === "personal" ? "個人タスク" : "組織タスク"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">優先度</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${pri.color}`}>{pri.label}優先</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 mb-1">作成日</p>
                <p className="text-sm text-gray-600">{formatDateTime(task.createdAt)}</p>
              </div>
              {task.completedAt && (
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">完了日</p>
                  <p className="text-sm text-gray-600">{formatDateTime(task.completedAt)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右：ステータス・メンバー */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

          {/* ステータス変更 */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">ステータス</p>
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
                <button
                  onClick={() => setShowInvite(!showInvite)}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  + 招待
                </button>
              )}
            </div>

            <div className="space-y-2">
              {task.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.role === "owner" ? "オーナー" : m.role === "assignee" ? "担当者" : "閲覧者"}</p>
                  </div>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      className="text-xs text-gray-300 hover:text-rose-400 transition flex-shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 招待パネル */}
            {showInvite && notInvited.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1.5">
                <p className="text-xs text-gray-400 mb-2">招待できるメンバー</p>
                {notInvited.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => { handleInvite(emp); setShowInvite(false); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-left transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {emp.name.charAt(0)}
                    </div>
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
            <button
              onClick={() => {
                const updated = addMessage(task.id, {
                  senderId: CURRENT_USER.id,
                  senderName: CURRENT_USER.name,
                  text: "進捗を共有します。現在対応中です。引き続きよろしくお願いします。",
                });
                if (updated) { setTask(updated); setTab("chat"); showToast("進捗報告を送信しました"); }
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
            >
              進捗を報告する
            </button>
            <button
              onClick={() => {
                const updated = addMessage(task.id, {
                  senderId: CURRENT_USER.id,
                  senderName: CURRENT_USER.name,
                  text: "対応に困っている点があります。サポートをお願いできますか？",
                });
                if (updated) { setTask(updated); setTab("chat"); showToast("サポート依頼を送信しました"); }
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
            >
              サポートを依頼する
            </button>
            <button
              onClick={() => {
                handleStatusChange("completed");
                const updated = addMessage(task.id, {
                  senderId: CURRENT_USER.id,
                  senderName: CURRENT_USER.name,
                  text: "タスクが完了しました。ご確認をお願いします。",
                });
                if (updated) setTask(updated);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
            >
              完了として報告する
            </button>
          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
