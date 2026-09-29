"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavigatorRecord } from "@/lib/goalNavigatorStore";
import RecordDetailView from "@/components/goal-navigator/RecordDetailView";

type Props = {
  record: NavigatorRecord;
};

export default function RecordActions({ record }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2 w-full">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
        >
          {open ? "詳細を閉じる" : "詳細を見る"}
        </button>
        <Link
          href={`/approvals/goal-navigators/${record.id}`}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
        >
          編集する
        </Link>
      </div>

      {open ? (
        <div className="w-full">
          <RecordDetailView record={record} />
        </div>
      ) : null}
    </div>
  );
}
