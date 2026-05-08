import { notFound } from "next/navigation";
import { getEmployee, calcTenure } from "@/lib/mockData";
import EmployeeCard from "@/components/EmployeeCard";
import BasicInfo from "@/components/BasicInfo";
import SkillRadar from "@/components/SkillRadar";
import GoalSection from "@/components/GoalSection";
import ThanksHistory from "@/components/ThanksHistory";
import GreetingBanner from "@/components/GreetingBanner";

const rankColors: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  A: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  B: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  C: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
};

export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = getEmployee(id);
  if (!employee) notFound();

  const tenure = calcTenure(employee.joinedAt);
  const rank = rankColors[employee.evaluationRank] ?? rankColors["B"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="font-bold text-gray-800 text-sm">KeyaTree</span>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-500 text-sm">社員情報</span>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">{employee.name}</span>
        </div>
      </header>

      {/* グリーティングバナー */}
      <GreetingBanner employee={employee} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">

          {/* 左サイドバー */}
          <aside className="md:w-64 flex-shrink-0 space-y-4">
            {/* プロフィールカード */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <EmployeeCard employee={employee} />
            </div>

            {/* 基本情報 */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <BasicInfo employee={employee} />
            </div>

            {/* 勤続年数 */}
            <div className={`bg-white rounded-2xl shadow-sm border ${rank.border} p-5 flex flex-col items-center justify-center`}>
              <p className="text-xs text-gray-400 mb-1">勤続年数</p>
              <p className="text-3xl font-black text-gray-800">{tenure}</p>
              <p className="text-xs text-gray-400 mt-1">{employee.joinedAt} 入社</p>
            </div>

            {/* 総合評価ランク */}
            <div className={`${rank.bg} rounded-2xl shadow-sm border ${rank.border} p-5 flex flex-col items-center justify-center`}>
              <p className="text-xs text-gray-400 mb-1">総合評価ランク</p>
              <p className={`text-5xl font-black ${rank.text}`}>
                {employee.evaluationRank}
              </p>
              <p className="text-xs text-gray-400 mt-1">2024年 下期</p>
            </div>
          </aside>

          {/* メインコンテンツ */}
          <div className="flex-1 space-y-5">

            {/* スキルマップ */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <SkillRadar skills={employee.skills} />
            </div>

            {/* 目標設定 */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <GoalSection goals={employee.goals} />
            </div>

            {/* サンクスカード */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <ThanksHistory thanks={employee.thanks} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
