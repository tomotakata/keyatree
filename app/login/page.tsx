"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { findAccount } from "@/lib/mockAccounts";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") || "/employees", [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const account = findAccount(email.trim(), password);
    if (!account) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    document.cookie = `kt_session=${JSON.stringify({
      id: account.id,
      name: account.name,
      email: account.email,
      permissionId: account.permissionId,
      permissionName: account.permissionName,
      employeeId: account.employeeId,
    })}; path=/; max-age=${60 * 60 * 8}`;

    router.push(redirectTo);
  };

  const destinationLabel = redirectTo.startsWith("/docs")
    ? "ドキュメント"
    : redirectTo.startsWith("/employees")
      ? "従業員管理"
      : "システム";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <span className="text-white text-3xl font-black">K</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-wide">KeyaTree</h1>
          <p className="text-emerald-100 text-sm mt-1">組織・人事管理システム</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">ログイン</h2>
          <p className="text-xs text-gray-400 text-center mb-6">ログイン後は {destinationLabel} ページへ移動します</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="example@keyaki-s.com"
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">パスワード</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
                >
                  {showPass ? "隠す" : "表示"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : "ログイン"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t">
            <p className="text-xs text-gray-400 font-semibold mb-2 text-center">デモアカウント</p>
            <div className="space-y-1.5">
              {[
                { role: "システム管理者", email: "admin@keyaki-s.com", pass: "admin1234" },
                { role: "人事管理者", email: "tanaka@keyaki-s.com", pass: "password123" },
                { role: "一般社員", email: "suzuki@keyaki-s.com", pass: "password123" },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass); setError(""); }}
                  className="w-full text-left flex items-center justify-between bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-lg px-3 py-2 transition"
                >
                  <span className="text-xs font-medium text-gray-700">{d.role}</span>
                  <span className="text-xs text-gray-400 font-mono">{d.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-300 text-center mt-2">クリックで自動入力</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600" />}>
      <LoginPageContent />
    </Suspense>
  );
}
