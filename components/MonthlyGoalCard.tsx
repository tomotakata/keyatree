"use client";

import { useState } from "react";
import { MonthlyGoal, GoalProgress } from "@/lib/mockData";

function ProgressBar({ value }: { value: number }) {
  const color = value >= 100 ? "bg-emerald-500" : value >= 60 ? "bg-blue-400" : "bg-amber-400";
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function GoalRow({ g }: { g: GoalProgress }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{g.title}</span>
        <span className="text-gray-400">{g.current} / {g.target}</span>
      </div>
      <div className="flex items-center gap-2">
        <ProgressBar value={g.progress} />
        <span className="text-xs font-bold text-gray-500 w-8 text-right">{g.progress}%</span>
      </div>
    </div>
  );
}

export default function MonthlyGoalCard({
  monthlyGoal,
  employeeName,
}: {
  employeeId: string;
  monthlyGoal: MonthlyGoal;
  employeeName: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"current" | "last">("current");
  const lm = monthlyGoal.lastMonth;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-medium">{monthlyGoal.month}の目標宣言</p>
            <h3 className="text-white font-bold text-base mt-0.5">今月の個人目標</h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-full transition"
          >
            進捗詳細
          </button>
        </div>

        <div className="p-5">
          {/* 宣言文 */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-gray-800 font-bold text-sm leading-relaxed text-center">
              "{monthlyGoal.declaration}"
            </p>
            <p className="text-right text-xs text-gray-400 mt-2">— {employeeName}</p>
          </div>
        </div>
      </div>

      {/* 進捗詳細モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-white font-bold text-base">進捗詳細</h3>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
            </div>

            {/* タブ */}
            <div className="flex border-b flex-shrink-0">
              <button
                onClick={() => setTab("current")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "current" ? "text-emerald-600 border-b-2 border-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
              >
                今月の進捗
              </button>
              <button
                onClick={() => setTab("last")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "last" ? "text-emerald-600 border-b-2 border-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
              >
                先月の振り返り
              </button>
            </div>

            {/* コンテンツ */}
            <div className="overflow-y-auto p-5 space-y-5 flex-1">

              {tab === "current" && (
                <>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-xs text-emerald-600 font-medium mb-1">{monthlyGoal.month}の目標宣言</p>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">"{monthlyGoal.declaration}"</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wide">目標別 進捗状況</h4>
                    {monthlyGoal.currentProgress.map((g, i) => (
                      <GoalRow key={i} g={g} />
                    ))}
                  </div>
                </>
              )}

              {tab === "last" && (
                <>
                  <div className={`rounded-xl p-4 border ${lm.achieved ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${lm.achieved ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                        {lm.achieved ? "目標達成" : "未達成"}
                      </span>
                      <span className="text-xs text-gray-400">{lm.month}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">"{lm.declaration}"</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wide">目標別 達成結果</h4>
                    {lm.goalResults.map((g, i) => (
                      <GoalRow key={i} g={g} />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-600 mb-1.5">反省点</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{lm.reflection}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-600 mb-1.5">改善点・今月への活かし方</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{lm.improvement}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-5 pb-5 pt-2 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-full text-sm border border-gray-200 rounded-xl py-2.5 text-gray-500 hover:bg-gray-50 font-medium transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
