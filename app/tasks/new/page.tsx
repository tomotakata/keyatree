"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * タスク作成はトーク内に一本化されました。
 * 従来の /tasks/new は チャンネル/トーク選択画面へ誘導します。
 */
export default function NewTaskRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/tasks/channels");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-bold">タスクはトーク内から作成します</p>
      <p className="text-sm text-zinc-500">チャンネル / トークの選択画面へ移動しています…</p>
      <button
        onClick={() => router.replace("/tasks/channels")}
        className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition"
      >
        チャンネル一覧を開く
      </button>
    </div>
  );
}
