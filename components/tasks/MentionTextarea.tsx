"use client";

import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react";

type Member = { id: string; name: string };

/**
 * @メンション用のオートコンプリート付きテキストエリア。
 * 「@」を入力するとトークルームのメンバー候補を表示し、選択すると本文に「@表示名 」を挿入する。
 * 名前に空白を含む場合も表示名そのものを挿入するため、後段のメンション解析と整合する。
 */
export default function MentionTextarea({
  value,
  onChange,
  members,
  placeholder,
  rows = 3,
  className = "",
  autoFocus = false,
  onSubmit,
  onEscape,
  onImageFiles,
}: {
  value: string;
  onChange: (value: string) => void;
  members: Member[];
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
  onEscape?: () => void;
  onImageFiles?: (files: File[]) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [atIndex, setAtIndex] = useState(-1);
  const [active, setActive] = useState(0);

  const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const suggestions = open
    ? members
        .filter((m) => query === "" || norm(m.name).includes(norm(query)))
        .slice(0, 8)
    : [];

  const detect = (el: HTMLTextAreaElement) => {
    const caret = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setOpen(false);
      return;
    }
    const prev = at > 0 ? before[at - 1] : "";
    if (prev && !/\s/.test(prev)) {
      setOpen(false);
      return;
    }
    const q = before.slice(at + 1);
    if (/\n/.test(q) || q.length > 20) {
      setOpen(false);
      return;
    }
    setAtIndex(at);
    setQuery(q);
    setActive(0);
    setOpen(true);
  };

  const insert = (m: Member) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const start = atIndex >= 0 ? atIndex : caret;
    const before = value.slice(0, start);
    const after = value.slice(caret);
    const insertText = `@${m.name} `;
    const next = before + insertText + after;
    onChange(next);
    setOpen(false);
    const pos = before.length + insertText.length;
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insert(suggestions[active] ?? suggestions[0]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit?.();
      return;
    }
    if (e.key === "Escape") {
      onEscape?.();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onImageFiles) return;
    const items = Array.from(e.clipboardData?.items ?? []);
    const files: File[] = [];
    for (const it of items) {
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      onImageFiles(files);
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        ref={ref}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target);
        }}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => detect(e.currentTarget)}
        onClick={(e) => detect(e.currentTarget)}
        onPaste={onPaste}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 bottom-full mb-1 z-30 w-64 max-h-56 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl py-1">
          {suggestions.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insert(m);
              }}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition ${
                i === active ? "bg-emerald-600/30 text-white" : "text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {m.name.charAt(0)}
              </span>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
