"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 一つ前のページに戻る共通ボタン。
 * 履歴が無い場合は fallback（既定 /employees）へ遷移する。
 */
export default function BackButton({
  fallback = "/employees",
  className = "",
}: {
  fallback?: string;
  className?: string;
}) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  if (!canGoBack) return null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="一つ前に戻る"
      className={
        "flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 rounded-full pl-2 pr-3 py-1.5 transition flex-shrink-0 " +
        className
      }
    >
      <span className="text-sm leading-none">‹</span>
      戻る
    </button>
  );
}
