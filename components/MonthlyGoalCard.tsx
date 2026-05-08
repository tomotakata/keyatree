"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MonthlyGoal, CheerComment } from "@/lib/mockData";

const MAX_BRAVO = 10;
const STORAGE_KEY = (employeeId: string) =>
  `bravo_${employeeId}_${new Date().toISOString().slice(0, 10)}`;

function CommentCard({ comment }: { comment: CheerComment }) {
  const roleColor =
    comment.role === "上長"
      ? "bg-amber-100 text-amber-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="flex gap-3 items-start">
      <Image
        src={comment.avatar}
        alt={comment.from}
        width={40}
        height={40}
        className="rounded-full flex-shrink-0"
      />
      <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-gray-800">{comment.from}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>
            {comment.role}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{comment.date}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{comment.message}</p>
      </div>
    </div>
  );
}

export default function MonthlyGoalCard({
  employeeId,
  monthlyGoal,
  employeeName,
}: {
  employeeId: string;
  monthlyGoal: MonthlyGoal;
  employeeName: string;
}) {
  const [bravoCount, setBravoCount] = useState(monthlyGoal.cheers);
  const [myBravo, setMyBravo] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showMax, setShowMax] = useState(false);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY(employeeId)) ?? "0");
    setMyBravo(saved);
  }, [employeeId]);

  const handleBravo = () => {
    if (myBravo >= MAX_BRAVO) {
      setShowMax(true);
      setTimeout(() => setShowMax(false), 2000);
      return;
    }
    const next = myBravo + 1;
    setMyBravo(next);
    setBravoCount((c) => c + 1);
    localStorage.setItem(STORAGE_KEY(employeeId), String(next));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
  };

  const remaining = MAX_BRAVO - myBravo;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-medium">{monthlyGoal.month}の目標宣言</p>
            <h3 className="text-white font-bold text-base mt-0.5">今月の目標</h3>
          </div>
          <span className="text-2xl">🎯</span>
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

        {/* ブラボーボタン */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-500">{bravoCount}</p>
              <p className="text-xs text-gray-400">BRAVO!</p>
            </div>

            <button
              onClick={handleBravo}
              disabled={myBravo >= MAX_BRAVO}
              className={`
                relative flex flex-col items-center justify-center
                w-20 h-20 rounded-full font-bold text-white shadow-lg
                transition-all duration-150 select-none
                ${myBravo >= MAX_BRAVO
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-br from-amber-400 to-orange-500 hover:scale-105 active:scale-95 cursor-pointer"
                }
                ${animating ? "scale-125" : ""}
              `}
            >
              <span className={`text-2xl transition-transform ${animating ? "scale-150" : ""}`}>
                👏
              </span>
              <span className="text-xs mt-0.5">BRAVO!</span>
            </button>

            <div className="text-center">
              <p className={`text-3xl font-black ${remaining > 0 ? "text-orange-400" : "text-gray-300"}`}>
                {remaining}
              </p>
              <p className="text-xs text-gray-400">残り回数</p>
            </div>
          </div>

          {showMax && (
            <p className="text-xs text-orange-500 font-medium animate-bounce">
              今日のブラボーは使い切りました！明日また応援できます
            </p>
          )}
          {!showMax && myBravo > 0 && myBravo < MAX_BRAVO && (
            <p className="text-xs text-gray-400">今日あと{remaining}回応援できます</p>
          )}
          {!showMax && myBravo === 0 && (
            <p className="text-xs text-gray-400">1日{MAX_BRAVO}回まで応援できます</p>
          )}
        </div>

        {/* 応援コメント */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              応援コメント
            </h4>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {monthlyGoal.comments.length}件
            </span>
          </div>
          <div className="space-y-3">
            {monthlyGoal.comments.map((c, i) => (
              <CommentCard key={i} comment={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
