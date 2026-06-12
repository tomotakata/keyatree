"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DraftItem = {
  id: string;
  title: string;
  department: string;
  savedAt?: string;
  href: string;
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ClientDraftHistory({
  storageKey,
  href,
  emptyLabel,
}: {
  storageKey: string;
  href: string;
  emptyLabel: string;
}) {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        answers?: Record<string, string>;
        recordId?: string;
        savedAt?: string;
      };

      if (!parsed.answers) return;

      setDrafts([
        {
          id: parsed.recordId || "local-draft",
          title: parsed.answers.goal || emptyLabel,
          department: parsed.answers.department || "部署未設定",
          savedAt: parsed.savedAt,
          href,
        },
      ]);
    } catch {}
  }, [emptyLabel, href, storageKey]);

  const hasDrafts = useMemo(() => drafts.length > 0, [drafts]);

  if (!hasDrafts) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-bold text-blue-800">このブラウザに保存されている下書き</p>
        <p className="mt-1 text-xs text-blue-700">
          Supabase未接続中は、下書きはこの端末のブラウザ内にも保持されます。
        </p>
      </div>

      {drafts.map((draft) => (
        <div key={draft.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-800">{draft.title}</p>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                  下書き
                </span>
              </div>
              <p className="text-sm text-gray-500">{draft.department}</p>
              <p className="text-xs text-gray-400">ブラウザ保存 {formatDate(draft.savedAt)}</p>
            </div>
            <Link
              href={draft.href}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              続きから再開
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}