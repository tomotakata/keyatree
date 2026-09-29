"use client";

import { useState, useTransition } from "react";
import { castVoteAction } from "@/lib/mvgActions";

export default function VoteModal({
  recipient,
  giverName,
  onClose,
  onVoted,
}: {
  recipient: { id: string; name: string; photo?: string };
  giverName: string;
  onClose: () => void;
  onVoted: () => void;
}) {
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await castVoteAction(recipient.id, message, date);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onVoted();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">MVG 投票</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            {recipient.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={recipient.photo} alt={recipient.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                {recipient.name.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-800">{recipient.name}</p>
              <p className="text-xs text-gray-500">投票先</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-gray-600">投票者</span>
              <input
                value={giverName}
                readOnly
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-gray-600">日付</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-gray-600">感謝メッセージ</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="どんな感謝を伝えたいですか？"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          {error ? (
            <p className="text-sm font-bold text-rose-600">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={submit}
              disabled={isPending || !message.trim()}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isPending ? "追加中..." : "追加"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
