"use client";

import { useState } from "react";
import Link from "next/link";
import { employees, calcTenure } from "@/lib/mockData";
import Avatar from "@/components/Avatar";

const rankColors: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-300" },
  A: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-300" },
  B: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-300" },
  C: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-300" },
};

const deptOptions = ["すべて", ...Array.from(new Set(employees.map((e) => e.department.split(" > ")[0])))];
const rankOptions = ["すべて", "S", "A", "B", "C"];

export default function EmployeeListPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("すべて");
  const [rank, setRank] = useState("すべて");

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.includes(search) ||
      e.nameKana.includes(search) ||
      e.department.includes(search) ||
      e.position.includes(search);
    const matchDept = dept === "すべて" || e.department.startsWith(dept);
    const matchRank = rank === "すべて" || e.evaluationRank === rank;
    return matchSearch && matchDept && matchRank;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm">KeyaTree</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">従業員一覧</span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/settings/masters"
              className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium px-3 py-2 rounded-lg transition"
            >
              マスター管理
            </Link>
            <Link
              href="/employees/new"
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition"
            >
              + 新規登録
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・部署・役職で検索..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {rankOptions.map((r) => <option key={r} value={r}>評価ランク：{r}</option>)}
          </select>
        </div>

        {/* 件数 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{filtered.length}</span> 名表示中
            {employees.length !== filtered.length && `（全${employees.length}名中）`}
          </p>
        </div>

        {/* カードグリッド */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">検索結果なし</p>
            <p className="text-sm">条件に一致する従業員が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => {
              const rc = rankColors[emp.evaluationRank] ?? rankColors["C"];
              return (
                <Link
                  key={emp.id}
                  href={`/employees/${emp.id}`}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
                >
                  {/* カードヘッダー（ランク色帯） */}
                  <div className={`h-1.5 w-full ${rc.bg.replace("bg-", "bg-").replace("50", "400")}`}
                    style={{ background: emp.evaluationRank === "S" ? "#f59e0b" : emp.evaluationRank === "A" ? "#10b981" : emp.evaluationRank === "B" ? "#3b82f6" : "#9ca3af" }}
                  />

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* アバター */}
                      <div className="flex-shrink-0">
                        {emp.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={emp.photo} alt={emp.name} className="w-14 h-14 rounded-full object-cover shadow" />
                        ) : (
                          <Avatar name={emp.name} size="lg" className="shadow" />
                        )}
                      </div>

                      {/* 基本情報 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 leading-none mb-0.5">{emp.nameKana}</p>
                        <h3 className="text-base font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                          {emp.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{emp.department}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{emp.position}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{emp.grade}</span>
                        </div>
                      </div>
                    </div>

                    {/* フッター */}
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-400">勤続 {calcTenure(emp.joinedAt)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{emp.employmentType}</span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                          {emp.evaluationRank}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
