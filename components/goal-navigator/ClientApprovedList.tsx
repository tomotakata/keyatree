"use client";

import { useEffect, useMemo, useState } from "react";

type ApprovedItem = {
  id: string;
  name: string;
  title: string;
  department: string;
  approvedAt?: string;
  kind: "quantitative" | "qualitative";
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ClientApprovedList() {
  const [items, setItems] = useState<ApprovedItem[]>([]);

  useEffect(() => {
    const sources = [
      { key: "keyatree_goal_navigator_draft", kind: "quantitative" as const },
      { key: "keyatree_qualitative_goal_navigator_draft", kind: "qualitative" as const },
    ];

    const nextItems: ApprovedItem[] = [];

    for (const source of sources) {
      const raw = window.localStorage.getItem(source.key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as {
          recordId?: string;
          approvedAt?: string;
          status?: "draft" | "submitted" | "approved";
          answers?: Record<string, string>;
        };
        if (parsed.status !== "approved" || !parsed.answers) continue;
        nextItems.push({
          id: parsed.recordId || `${source.kind}-local-approved`,
          name: parsed.answers.name || "名前未設定",
          title: parsed.answers.goal || (source.kind === "quantitative" ? "目標設定シート" : "定性目標設定シート"),
          department: parsed.answers.department || "部署未設定",
          approvedAt: parsed.approvedAt,
          kind: source.kind,
        });
      } catch {}
    }

    setItems(nextItems);
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);
  if (!hasItems) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-bold text-emerald-800">このブラウザで承認済みになったレコード</p>
        <p className="mt-1 text-xs text-emerald-700">Supabase未接続中は、この端末内で承認済みになったデータを表示します。</p>
      </div>

      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-gray-800">{item.title}</p>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  承認済み
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.kind === "quantitative" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
                  {item.kind === "quantitative" ? "目標設定" : "定性目標"}
                </span>
              </div>
              <p className="text-sm text-gray-700">{item.name}</p>
              <p className="text-sm text-gray-500">{item.department}</p>
              <p className="text-xs text-gray-400">ブラウザ承認 {formatDate(item.approvedAt)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}