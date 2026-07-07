"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Session = {
  name: string;
  email: string;
  permissionName: string;
  employeeId: string;
};

function parseCookieSession(): Session | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/kt_session=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); }
  catch { return null; }
}

export default function HeaderNav({ currentLabel, extraRight }: { currentLabel?: string; extraRight?: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSession(parseCookieSession());
  }, []);

  const handleLogout = () => {
    document.cookie = "kt_session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* ロゴ */}
        <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">K</span>
        </Link>
        <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>

        {currentLabel && (
          <>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-gray-700 text-sm font-medium">{currentLabel}</span>
          </>
        )}

        {/* 右側 */}
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/features"
            className="text-xs font-bold text-gray-600 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 rounded-full px-3 py-1.5 transition"
          >
            機能一覧
          </Link>
          {extraRight}
          {session ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-1.5 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{session.name.slice(0, 1)}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-gray-700 leading-none">{session.name}</p>
                <p className="text-xs text-gray-400 leading-none mt-0.5">{session.permissionName}</p>
              </div>
              <span className="text-gray-400 text-xs">▾</span>
            </button>
          ) : null}
        </div>

        {/* ドロップダウン（外側に配置） */}
        {menuOpen && session && (
          <div className="relative">
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 top-0 mt-1 w-52 bg-white rounded-2xl border shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-xs font-bold text-gray-700">{session.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{session.email}</p>
                </div>
                <div className="py-1">
                  {session.employeeId && (
                    <Link
                      href={`/employees/${session.employeeId}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      マイプロフィール
                    </Link>
                  )}
                  <Link
                    href="/settings/accounts"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    アカウント管理
                  </Link>
                  <Link
                    href="/settings/masters"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    マスター管理
                  </Link>
                  <Link
                    href="/settings/permissions"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    権限管理
                  </Link>
                  <Link
                    href="/goal-navigator"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    目標設定ナビ
                  </Link>
                  <Link
                    href="/qualitative-goal-navigator"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    定性目標ナビ
                  </Link>
                  <Link
                    href="/goal-navigator/history"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    目標設定履歴
                  </Link>
                  <Link
                    href="/approvals/goal-navigators"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    承認一覧
                  </Link>
                  <div className="border-t my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </header>
  );
}
