"use client";

import Link from "next/link";
import { MonthlyGoal } from "@/lib/mockData";
import ProgressReminder from "@/components/goal-navigator/ProgressReminder";

export default function MonthlyGoalCard({
  employeeId,
  monthlyGoal,
  employeeName,
}: {
  employeeId: string;
  monthlyGoal: MonthlyGoal;
  employeeName: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-emerald-100 font-medium">今期の目標宣言</p>
          <h3 className="text-white font-bold text-base mt-0.5">今期の目標管理</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/goal-navigator"
            className="text-sm bg-white hover:bg-gray-100 text-emerald-600 font-bold px-3 py-1.5 rounded-xl transition"
          >
            定量目標設定を開始
          </Link>
          <Link
            href="/qualitative-goal-navigator"
            className="text-sm bg-white hover:bg-gray-100 text-indigo-600 font-bold px-3 py-1.5 rounded-xl transition"
          >
            定性目標設定を開始
          </Link>
          <Link
            href="/my-goals"
            className="text-sm bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl transition"
          >
            過去の目標履歴
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 宣言文（設定済みのときのみ表示） */}
        {monthlyGoal.declaration?.trim() ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-gray-800 font-bold text-sm leading-relaxed text-center">
              "{monthlyGoal.declaration}"
            </p>
            <p className="text-right text-xs text-gray-400 mt-2">— {employeeName}</p>
          </div>
        ) : null}

        {/* 承認済み目標 進捗リマインド */}
        <ProgressReminder employeeId={employeeId} />
      </div>
    </div>
  );
}
