"use client";

import { useState } from "react";
import MemberPicker from "@/components/tasks/MemberPicker";
import { apiCreateTask } from "@/lib/taskClient";
import type { FullTask, TaskPriority, TaskType } from "@/lib/taskStore";

/** トークルーム内で依頼（タスク）を作成するモーダル。担当者はそのトークルームのメンバーから個別指定する。 */
export default function CreateTaskModal({
  channelId,
  channelName,
  talkId,
  talkName,
  candidates,
  initialTitle = "",
  initialDescription = "",
  onClose,
  onCreated,
}: {
  channelId: string;
  channelName: string;
  talkId: string;
  talkName: string;
  candidates: { id: string; name: string }[];
  initialTitle?: string;
  initialDescription?: string;
  onClose: () => void;
  onCreated: (task: FullTask) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [type, setType] = useState<TaskType>("org");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (assignees.length === 0) {
      setError("依頼する担当者を1名以上選んでください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const picked = assignees
        .map((id) => candidates.find((c) => c.id === id))
        .filter((c): c is { id: string; name: string } => !!c);
      const task = await apiCreateTask({
        title: title.trim(),
        description: description.trim(),
        deadline: deadline || "",
        category: channelName,
        type,
        priority,
        assignees: picked,
        channelId,
        talkId,
        talkName,
      });
      onCreated(task);
    } catch (e) {
      setError((e as Error).message || "作成に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">依頼（タスク）を作成</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-[11px] text-gray-400">
            {channelName} / # {talkName} の依頼として作成します。指定した担当者のマイページ・タスク一覧に反映されます。
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">タイトル <span className="text-rose-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 甲府店の契約書を確認"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">詳細・説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="依頼内容の詳細"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">期日・時刻</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">種別</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="org">組織</option>
                <option value="personal">個人</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">依頼する担当者 <span className="text-rose-500">*</span></label>
            <p className="text-[11px] text-gray-400 mb-1">このトークルームの参加メンバーから選択します。選んだ人に追いかけ（リマインド）が発生します。</p>
            <MemberPicker selectedIds={assignees} onChange={setAssignees} candidates={candidates} />
          </div>
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">キャンセル</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition disabled:opacity-60">
            {saving ? "作成中..." : "依頼を作成"}
          </button>
        </div>
      </div>
    </div>
  );
}
