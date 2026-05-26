"use client";

import Link from "next/link";
import { permissions, accessLabels, featureLabels } from "@/lib/permissions";

const colorMap: Record<string, { badge: string; header: string; dot: string }> = {
  rose:    { badge: "bg-rose-100 text-rose-700 border border-rose-200",    header: "bg-rose-500",    dot: "bg-rose-400" },
  amber:   { badge: "bg-amber-100 text-amber-700 border border-amber-200", header: "bg-amber-500",   dot: "bg-amber-400" },
  blue:    { badge: "bg-blue-100 text-blue-700 border border-blue-200",    header: "bg-blue-500",    dot: "bg-blue-400" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", header: "bg-emerald-500", dot: "bg-emerald-400" },
  gray:    { badge: "bg-gray-100 text-gray-600 border border-gray-200",    header: "bg-gray-400",    dot: "bg-gray-400" },
};

const accessStyle: Record<string, string> = {
  full: "bg-emerald-100 text-emerald-700 font-bold",
  dept: "bg-blue-100 text-blue-700 font-bold",
  self: "bg-amber-100 text-amber-700 font-bold",
  read: "bg-gray-100 text-gray-600",
  none: "bg-rose-50 text-rose-400 line-through",
};

export default function PermissionsPage() {
  const featureKeys = Object.keys(featureLabels);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-500 text-sm">設定</span>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">権限管理</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">権限管理</h1>
          <p className="text-sm text-gray-500 mt-1">各権限ロールのアクセス範囲と制限を確認できます。</p>
        </div>

        {/* 権限カード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissions.map((perm) => {
            const c = colorMap[perm.color];
            return (
              <div key={perm.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* カラーヘッダー */}
                <div className={`${c.header} px-5 py-4`}>
                  <span className="text-white font-bold text-base">{perm.name}</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed">{perm.description}</p>

                  {/* アクセスレベル表 */}
                  <div className="space-y-1.5">
                    {featureKeys.map((key) => {
                      const val = perm.access[key as keyof typeof perm.access];
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{featureLabels[key]}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${accessStyle[val]}`}>
                            {accessLabels[val]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* できること */}
                  <div className="border-t pt-3 space-y-1">
                    {perm.notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
                        <span className="text-xs text-gray-500 leading-relaxed">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 比較テーブル */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700">権限比較表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold w-28">機能</th>
                  {permissions.map((p) => {
                    const c = colorMap[p.color];
                    return (
                      <th key={p.id} className="px-3 py-3 text-center min-w-[96px]">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.badge}`}>{p.name}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y">
                {featureKeys.map((key) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">{featureLabels[key]}</td>
                    {permissions.map((p) => {
                      const val = p.access[key as keyof typeof p.access];
                      return (
                        <td key={p.id} className="px-3 py-2.5 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${accessStyle[val]}`}>
                            {accessLabels[val]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
