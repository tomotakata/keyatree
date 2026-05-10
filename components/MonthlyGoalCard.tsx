"use client";

import { MonthlyGoal } from "@/lib/mockData";

export default function MonthlyGoalCard({
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
      <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4">
        <p className="text-xs text-emerald-100 font-medium">{monthlyGoal.month}の目標宣言</p>
        <h3 className="text-white font-bold text-base mt-0.5">今月の目標</h3>
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
  );
}
