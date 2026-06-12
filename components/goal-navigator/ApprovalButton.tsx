"use client";

import { useTransition } from "react";
import { approveNavigatorRecordAction } from "@/lib/goalNavigatorActions";

export default function ApprovalButton({ recordId }: { recordId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await approveNavigatorRecordAction(recordId);
        });
      }}
      disabled={pending}
      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "承認中..." : "承認する"}
    </button>
  );
}