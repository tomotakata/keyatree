"use client";

import Link from "next/link";

/**
 * アップデート中オーバーレイ。
 * 画面全体を覆い、操作をブロックしたうえで中央に「アップデート中」を表示する。
 */
export default function UnderMaintenance({ title = "この機能" }: { title?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 mx-auto flex items-center justify-center text-3xl mb-4">
          🛠️
        </div>
        <h1 className="text-xl font-black text-gray-900">アップデート中</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {title}は現在アップデート作業中のため、一時的にご利用いただけません。
          <br />
          ご不便をおかけしますが、しばらくお待ちください。
        </p>
        <Link
          href="/employees"
          className="mt-6 inline-block bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition"
        >
          マイページに戻る
        </Link>
      </div>
    </div>
  );
}
