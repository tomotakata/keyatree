"use client";

import { useState, useEffect } from "react";
import { MonthlyGoal, CheerComment, Reply, markHotComments } from "@/lib/mockData";
import Avatar from "@/components/Avatar";

const LIKES_KEY = (employeeId: string) => `likes_${employeeId}`;
const REPLIES_KEY = (employeeId: string) => `replies_${employeeId}`;

// ---- 返信 + いいね付きコメントカード ----
function CommentCard({
  comment,
  isHot,
  likedIds,
  onLike,
  extraReplies,
  onAddReply,
  employeeName,
}: {
  comment: CheerComment;
  isHot: boolean;
  likedIds: Set<string>;
  onLike: (id: string) => void;
  extraReplies: Reply[];
  onAddReply: (commentId: string, text: string) => void;
  employeeName: string;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const roleColor = comment.role === "上長"
    ? "bg-amber-100 text-amber-700"
    : "bg-blue-100 text-blue-700";
  const liked = likedIds.has(comment.id);
  const likeCount = comment.likes + (liked ? 1 : 0);
  const allReplies = [...comment.replies, ...extraReplies];

  return (
    <div className="flex gap-3 items-start w-full">
      {comment.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.avatar} alt={comment.from} className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <Avatar name={comment.from} size="md" className="mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        {/* バブル本体 */}
        <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-gray-800">{comment.from}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>{comment.role}</span>
            {isHot && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white animate-pulse">
                HOT
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{comment.date}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{comment.message}</p>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"
            }`}
          >
            <span className={`text-base transition-transform ${liked ? "scale-125" : ""}`}>
              {liked ? "♥" : "♡"}
            </span>
            {likeCount}
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-gray-400 hover:text-emerald-500 font-medium transition-colors"
          >
            返信
          </button>
        </div>

        {/* 返信一覧 */}
        {allReplies.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-emerald-100">
            {allReplies.map((r) => (
              <div key={r.id} className="flex gap-2 items-start">
                    <Avatar name={r.from} size="sm" />
                <div className="bg-emerald-50 rounded-xl rounded-tl-none px-3 py-2 flex-1">
                  <span className="text-xs font-bold text-gray-700 mr-2">{r.from}</span>
                  <span className="text-xs text-gray-500">{r.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 返信入力 */}
        {showReply && (
          <div className="mt-2 flex gap-2 items-center">
            <Avatar name={employeeName} size="sm" />
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && replyText.trim()) {
                  onAddReply(comment.id, replyText.trim());
                  setReplyText("");
                  setShowReply(false);
                }
              }}
              placeholder="返信を入力… (Enterで送信)"
              className="flex-1 text-xs bg-gray-100 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              onClick={() => {
                if (replyText.trim()) {
                  onAddReply(comment.id, replyText.trim());
                  setReplyText("");
                  setShowReply(false);
                }
              }}
              className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-emerald-600 transition"
            >
              送信
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----
export default function MonthlyGoalCard({
  employeeId,
  monthlyGoal,
  employeeName,
}: {
  employeeId: string;
  monthlyGoal: MonthlyGoal;
  employeeName: string;
}) {
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");
  const [current, setCurrent] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [extraReplies, setExtraReplies] = useState<Record<string, Reply[]>>({});

  const hotComments = markHotComments(monthlyGoal.comments);

  useEffect(() => {
    const savedLikes: string[] = JSON.parse(localStorage.getItem(LIKES_KEY(employeeId)) ?? "[]");
    setLikedIds(new Set(savedLikes));
    const savedReplies: Record<string, Reply[]> = JSON.parse(localStorage.getItem(REPLIES_KEY(employeeId)) ?? "{}");
    setExtraReplies(savedReplies);
  }, [employeeId]);

  const handleLike = (commentId: string) => {
    if (likedIds.has(commentId)) return;
    const next = new Set(likedIds).add(commentId);
    setLikedIds(next);
    localStorage.setItem(LIKES_KEY(employeeId), JSON.stringify([...next]));
  };

  const handleAddReply = (commentId: string, text: string) => {
    const newReply: Reply = {
      id: `r_${Date.now()}`,
      from: employeeName,
      avatar: "",
      message: text,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = { ...extraReplies, [commentId]: [...(extraReplies[commentId] ?? []), newReply] };
    setExtraReplies(updated);
    localStorage.setItem(REPLIES_KEY(employeeId), JSON.stringify(updated));
  };

  const total = hotComments.length;
  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-medium">{monthlyGoal.month}の目標宣言</p>
            <h3 className="text-white font-bold text-base mt-0.5">今月の目標</h3>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 宣言文 */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-gray-800 font-bold text-sm leading-relaxed text-center">
            "{monthlyGoal.declaration}"
          </p>
          <p className="text-right text-xs text-gray-400 mt-2">— {employeeName}</p>
        </div>

        {/* 応援コメント ヘッダー */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">応援コメント</h4>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{total}件</span>
            </div>
            <button
              onClick={() => setViewMode(viewMode === "carousel" ? "list" : "carousel")}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1"
            >
              {viewMode === "carousel" ? "☰ 一覧" : "◀▶ スライド"}
            </button>
          </div>

          {/* カルーセル表示 */}
          {viewMode === "carousel" && (
            <div className="relative">
              <div className="overflow-hidden rounded-xl">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${current * 100}%)` }}
                >
                  {hotComments.map((c) => (
                    <div key={c.id} className="w-full flex-shrink-0 px-1 py-2">
                      <CommentCard
                        comment={c}
                        isHot={c.isHot}
                        likedIds={likedIds}
                        onLike={handleLike}
                        extraReplies={extraReplies[c.id] ?? []}
                        onAddReply={handleAddReply}
                        employeeName={employeeName}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 左右ボタン */}
              <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-7 h-7 rounded-full bg-white shadow border flex items-center justify-center text-gray-500 hover:text-emerald-600 text-xs transition">
                ‹
              </button>
              <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-7 h-7 rounded-full bg-white shadow border flex items-center justify-center text-gray-500 hover:text-emerald-600 text-xs transition">
                ›
              </button>

              {/* ドットインジケーター */}
              <div className="flex justify-center gap-1.5 mt-3">
                {hotComments.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-emerald-500 w-4" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* リスト表示 */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {hotComments.map((c) => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  isHot={c.isHot}
                  likedIds={likedIds}
                  onLike={handleLike}
                  extraReplies={extraReplies[c.id] ?? []}
                  onAddReply={handleAddReply}
                  employeeName={employeeName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
