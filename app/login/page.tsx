"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") || "/employees", [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const trimmedEmail = email.trim();

    // 入力チェック（空欄・形式）
    let hasInputError = false;
    if (!trimmedEmail) {
      setEmailError("メールアドレスを入力してください");
      hasInputError = true;
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError("メールアドレスの形式が正しくありません");
      hasInputError = true;
    }
    if (!password) {
      setPasswordError("パスワードを入力してください");
      hasInputError = true;
    }
    if (hasInputError) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data?.error ?? "ログイン処理でエラーが発生しました");
        setLoading(false);
        return;
      }

      if (!data.ok) {
        if (data.field === "email") setEmailError(data.message);
        else if (data.field === "password") setPasswordError(data.message);
        else setFormError(data.message ?? "ログインに失敗しました");
        setLoading(false);
        return;
      }

      const account = data.account;
      document.cookie = `kt_session=${encodeURIComponent(
        JSON.stringify({
          id: account.id,
          name: account.name,
          email: account.email,
          permissionId: account.permissionId,
          permissionName: account.permissionName,
          employeeId: account.employeeId,
        })
      )}; path=/; max-age=${60 * 60 * 8}`;

      // ログイン後は必ず本人のマイページを開く（未紐付けの場合のみ redirect 先へ）
      const myPage = account.employeeId
        ? `/employees/${encodeURIComponent(account.employeeId)}`
        : redirectTo;
      router.push(myPage);
    } catch {
      setFormError("通信エラーが発生しました。時間をおいて再度お試しください");
      setLoading(false);
    }
  };

  const destinationLabel = redirectTo.startsWith("/docs")
    ? "ドキュメント"
    : redirectTo.startsWith("/employees")
      ? "スタッフ管理"
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
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); setFormError(""); }}
                placeholder="example@keyaki-s.com"
                className={`w-full text-sm border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition ${
                  emailError
                    ? "border-rose-300 focus:ring-rose-300 bg-rose-50/40"
                    : "border-gray-200 focus:ring-emerald-300"
                }`}
              />
              {emailError && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <span className="text-rose-400">⚠</span>{emailError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">パスワード</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(""); setFormError(""); }}
                  placeholder="••••••••"
                  className={`w-full text-sm border rounded-xl px-4 py-3 pr-16 focus:outline-none focus:ring-2 transition ${
                    passwordError
                      ? "border-rose-300 focus:ring-rose-300 bg-rose-50/40"
                      : "border-gray-200 focus:ring-emerald-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
                >
                  {showPass ? "隠す" : "表示"}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <span className="text-rose-400">⚠</span>{passwordError}
                </p>
              )}
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <p className="text-xs text-rose-600 font-medium">{formError}</p>
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
