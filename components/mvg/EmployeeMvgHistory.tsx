"use client";

import { useEffect, useState, useTransition } from "react";
import { getMvgPeriodsAction, getMvgVotesForEmployeeAction } from "@/lib/mvgActions";
import type { MvgVote } from "@/lib/mvgStore";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function EmployeeMvgHistory({ employeeId }: { employeeId: string }) {
  const [periods, setPeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>("");
  const [votes, setVotes] = useState<MvgVote[]>([]);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getMvgPeriodsAction();
      if (res.ok) {
        setPeriods(res.periods);
        if (!period) setPeriod(res.periods[0] || new Date().getFullYear().toString());
      }
    });
  }, []);

  useEffect(() => {
    if (!period) return;
    startTransition(async () => {
      const res = await getMvgVotesForEmployeeAction(employeeId, period);
      if (res.ok) setVotes(res.votes);
    });
  }, [employeeId, period]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-800">MVG 受賞履歴</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-gray-800 focus:border-emerald-400 focus:outline-none"
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}年
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <span className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : votes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">{period}年の受賞履歴はまだありません。</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">giver</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {votes.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(v.votedAt)}</td>
                  <td className="px-4 py-3 text-gray-800 font-bold whitespace-nowrap">{v.fromEmployeeName}</td>
                  <td className="px-4 py-3 text-gray-700">{v.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
