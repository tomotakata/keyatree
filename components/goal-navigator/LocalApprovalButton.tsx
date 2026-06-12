"use client";

import { useState } from "react";

type Props = {
  storageKey: string;
  onApproved?: () => void;
};

export default function LocalApprovalButton({ storageKey, onApproved }: Props) {
  const [approved, setApproved] = useState(false);

  return (
    <button
      onClick={() => {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          parsed.status = "approved";
          parsed.approvedAt = new Date().toISOString();
          window.localStorage.setItem(storageKey, JSON.stringify(parsed));
          setApproved(true);
          onApproved?.();
        } catch {}
      }}
      disabled={approved}
      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {approved ? "承認済み" : "承認する"}
    </button>
  );
}
