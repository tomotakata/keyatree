"use client";

import { useState } from "react";
import Link from "next/link";
import { mockAccounts, Account } from "@/lib/mockAccounts";
import { permissions } from "@/lib/permissions";
import Avatar from "@/components/Avatar";

const permColorMap: Record<string, string> = {
  admin:        "bg-rose-100 text-rose-700 border-rose-200",
  hr_manager:   "bg-amber-100 text-amber-700 border-amber-200",
  dept_manager: "bg-blue-100 text-blue-700 border-blue-200",
  staff:        "bg-emerald-100 text-emerald-700 border-emerald-200",
  readonly:     "bg-gray-100 text-gray-600 border-gray-200",
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
      active ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-gray-100 text-gray-400 border-gray-200"
    }`}>
      {active ? "有効" : "停止"}
    </span>
  );
}

function EditModal({
  account,
  onClose,
  onSave,
}: {
  account: Account;
  onClose: () => void;
  onSave: (updated: Partial<Account>) => void;
}) {
  const [permissionId, setPermissionId] = useState(account.permissionId);
  const [isActive, setIsActive] = useState(account.isActive);
  const [resetPass, setResetPass] = useState("");

  const selectedPerm = permissions.find((p) => p.id === permissionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-4">
          <h3 className="text-white font-bold">アカウント編集</h3>
          <p className="text-emerald-100 text-xs mt-0.5">{account.name} / {account.email}</p>
        </div>
        <div className="p-5 space-y-5">
          {/* 権限変更 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">権限</label>
            <div className="grid grid-cols-1 gap-2">
              {permissions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPermissionId(p.id)}
                  className={`text-left px-4 py-2.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                    permissionId === p.id
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${permColorMap[p.id]}`}>{p.name}</span>
                  {permissionId === p.id && <span className="text-xs text-emerald-600 font-bold">選択中</span>}
                </button>
              ))}
            </div>
          </div>

          {/* パスワードリセット */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              パスワードリセット <span className="text-gray-400 font-normal">（変更する場合のみ入力）</span>
            </label>
            <input
              type="password"
              value={resetPass}
              onChange={(e) => setResetPass(e.target.value)}
              placeholder="新しいパスワード（8文字以上）"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* 有効/停止 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
            <div>
              <p className="text-sm font-medium text-gray-700">アカウント状態</p>
              <p className="text-xs text-gray-400">停止するとログイン不可になります</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isActive ? "left-7" : "left-1"}`} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm border border-gray-200 rounded-xl py-2.5 text-gray-500 hover:bg-gray-50 transition">
            キャンセル
          </button>
          <button
            onClick={() => onSave({
              permissionId,
              permissionName: selectedPerm?.name ?? "",
              isActive,
              ...(resetPass.length >= 8 ? { password: resetPass } : {}),
            })}
            className="flex-1 text-sm bg-emerald-500 text-white rounded-xl py-2.5 font-bold hover:bg-emerald-600 transition"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (updated: Partial<Account>) => {
    if (!editTarget) return;
    setAccounts((prev) =>
      prev.map((a) => a.id === editTarget.id ? { ...a, ...updated } : a)
    );
    setEditTarget(null);
    showToast("アカウント情報を更新しました");
  };

  const filtered = accounts.filter((a) =>
    a.name.includes(search) || a.email.includes(search) || a.permissionName.includes(search)
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </Link>
            <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-gray-500 text-sm">設定</span>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-gray-700 text-sm font-medium">アカウント管理</span>
            <div className="ml-auto">
              <Link
                href="/employees/new"
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition"
              >
                + スタッフを追加
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">アカウント管理</h1>
            <p className="text-sm text-gray-500 mt-1">ログインアカウントの権限・状態を管理します。</p>
          </div>

          {/* 検索 */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="名前・メールアドレス・権限で検索..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "総アカウント数", value: accounts.length, color: "text-gray-800" },
              { label: "有効", value: accounts.filter((a) => a.isActive).length, color: "text-emerald-600" },
              { label: "停止中", value: accounts.filter((a) => !a.isActive).length, color: "text-rose-500" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border shadow-sm px-5 py-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* アカウント一覧 */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">{filtered.length}件</p>
            </div>
            <div className="divide-y">
              {filtered.map((account) => (
                <div key={account.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
                  <Avatar name={account.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">{account.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${permColorMap[account.permissionId] ?? permColorMap.readonly}`}>
                        {account.permissionName}
                      </span>
                      <StatusBadge active={account.isActive} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{account.email}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      最終ログイン：{account.lastLoginAt ?? "未ログイン"}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditTarget(account)}
                    className="text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition opacity-0 group-hover:opacity-100"
                  >
                    編集
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {editTarget && (
        <EditModal account={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
