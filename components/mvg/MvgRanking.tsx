"use client";

import type { MvgRankingEntry } from "@/lib/mvgStore";

export default function MvgRanking({
  ranking,
  totalVotes,
  staffMap,
}: {
  ranking: MvgRankingEntry[];
  totalVotes: number;
  staffMap: Map<string, { name: string; photo?: string; team?: string }>;
}) {
  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">まだ投票がありません。</p>
        <p className="text-xs text-gray-400 mt-1">最初の MVG 投票をしてみましょう！</p>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-800">現在のランキング</p>
        <span className="text-xs text-gray-500">合計 {totalVotes} 票</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((entry, idx) => {
          const s = staffMap.get(entry.employeeId);
          const rankColor = idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-700";
          return (
            <div key={entry.employeeId} className="rounded-2xl border bg-white p-4 text-center shadow-sm">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black mb-2 ${rankColor}`}>
                {idx + 1}
              </div>
              {s?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo} alt={entry.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-2">
                  {entry.name.slice(0, 1)}
                </div>
              )}
              <p className="text-sm font-bold text-gray-800">{entry.name}</p>
              <p className="text-xs text-gray-500">{s?.team}</p>
              <p className="mt-2 text-lg font-black text-emerald-600">{entry.count} 票</p>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">順位</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">名前</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">票数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rest.map((entry, idx) => {
                const s = staffMap.get(entry.employeeId);
                return (
                  <tr key={entry.employeeId}>
                    <td className="px-4 py-2 text-gray-500 font-bold">{idx + 4}</td>
                    <td className="px-4 py-2 text-gray-800 font-bold">{entry.name}</td>
                    <td className="px-4 py-2 text-right font-black text-emerald-600">{entry.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
